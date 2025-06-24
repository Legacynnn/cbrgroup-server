import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateFurnitureDto, PaginationQueryDto, PaginationResponseDto } from './dto/create-forniture.dto';
import { UpdateFurnitureDto } from './dto/update-forniture.dto';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FurnitureService {
  constructor(private prisma: PrismaService) {}

  async create(createFurnitureDto: CreateFurnitureDto) {
    const { variations, images, imageUrl, updateImageUrl, ...furnitureData } = createFurnitureDto;
    
    return this.prisma.$transaction(async (prisma) => {
      const furniture = await prisma.furniture.create({
        data: {
          ...furnitureData,
          variations: variations && variations.length > 0 ? {
            create: variations,
          } : undefined,
        },
        include: {
          variations: true,
          images: {
            orderBy: {
              position: 'asc'
            }
          },
        },
      });

      if (images && images.length > 0) {
        await prisma.furnitureImage.createMany({
          data: images.map(img => ({
            url: img.url,
            position: img.position,
            furnitureId: furniture.id,
          })),
        });
      }

      return prisma.furniture.findUnique({
        where: { id: furniture.id },
        include: {
          variations: true,
          images: {
            orderBy: {
              position: 'asc'
            }
          },
        },
      });
    });
  }

  async findAll() {
    const furniture = await this.prisma.furniture.findMany({
      include: {
        variations: true,
        images: {
          orderBy: {
            position: 'asc'
          }
        },
      },
    });

    // Remove producer field from public responses
    return furniture.map(item => {
      const { producer, ...publicData } = item;
      return publicData;
    });
  }

  async findAllAdmin() {
    return this.prisma.furniture.findMany({
      include: {
        variations: true,
        images: {
          orderBy: {
            position: 'asc'
          }
        },
      },
    });
  }

  async findAllWithPagination(
    query: PaginationQueryDto, 
    inStockOnly: boolean = false,
    isAdmin: boolean = false
  ): Promise<PaginationResponseDto<any>> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      producer,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    // Convert page and limit to numbers and validate
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit))); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    
    // If inStockOnly is true, force filter to in-stock items
    if (inStockOnly) {
      where.inStock = true;
    } else if (inStock !== undefined) {
      // For admin route, allow filtering by stock status
      // Handle both boolean and string values from query parameters
      const inStockValue = typeof inStock === 'string' 
        ? inStock === 'true' 
        : Boolean(inStock);
      where.inStock = inStockValue;
    }

    // Add category filter
    if (category) {
      where.category = {
        equals: category,
        mode: 'insensitive'
      };
    }

    // Add producer filter (only for admin)
    if (producer && isAdmin) {
      where.producer = {
        equals: producer,
        mode: 'insensitive'
      };
    }

    // Add search functionality
    if (search) {
      const searchFields = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          category: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];

      // Add producer to search only for admin
      if (isAdmin) {
        searchFields.push({
          producer: {
            contains: search,
            mode: 'insensitive'
          }
        });
      }

      where.OR = searchFields;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'name' || sortBy === 'category' || (sortBy === 'producer' && isAdmin)) {
      orderBy[sortBy] = sortOrder;
    } else if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc'; // Default sorting
    }

    try {
      // Execute queries in parallel
      const [furniture, total] = await Promise.all([
        this.prisma.furniture.findMany({
          where,
          skip,
          take: limitNum,
          orderBy,
          include: {
            variations: true,
            images: {
              orderBy: {
                position: 'asc'
              }
            },
          },
        }),
        this.prisma.furniture.count({ where })
      ]);

      const totalPages = Math.ceil(total / limitNum);

      // Remove producer field from public responses
      const data = isAdmin ? furniture : furniture.map(item => {
        const { producer, ...publicData } = item;
        return publicData;
      });

      return {
        data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
        filters: {
          search,
          category,
          producer: isAdmin ? producer : undefined,
          inStock: inStockOnly ? true : inStock,
          sortBy,
          sortOrder
        }
      };
    } catch (error) {
      console.error('Error in findAllWithPagination:', error);
      throw new Error('Failed to fetch furniture with pagination');
    }
  }

  async findCategories() {
    const result = await this.prisma.furniture.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
    });
    
    return result.map(item => item.category).filter(Boolean);
  }

  async findProducers() {
    const result = await this.prisma.furniture.findMany({
      select: {
        producer: true,
      },
      distinct: ['producer'],
    });
    
    return result.map(item => item.producer).filter(Boolean);
  }

  async bulkUpdateStock(furnitureIds: string[], inStock: boolean) {
    const updatedFurniture = await this.prisma.furniture.updateMany({
      where: {
        id: {
          in: furnitureIds,
        },
      },
      data: {
        inStock,
      },
    });

    return {
      message: `Successfully updated ${updatedFurniture.count} furniture items`,
      updatedCount: updatedFurniture.count,
      inStock,
    };
  }

  async findOne(id: string) {
    const furniture = await this.prisma.furniture.findUnique({
      where: { id },
      include: {
        variations: true,
        images: {
          orderBy: {
            position: 'asc'
          }
        },
      },
    });

    if (!furniture) {
      throw new NotFoundException(`Furniture with ID ${id} not found`);
    }

    // Remove producer field from public responses
    const { producer, ...publicData } = furniture;
    return publicData;
  }

  async findOneAdmin(id: string) {
    const furniture = await this.prisma.furniture.findUnique({
      where: { id },
      include: {
        variations: true,
        images: {
          orderBy: {
            position: 'asc'
          }
        },
      },
    });

    if (!furniture) {
      throw new NotFoundException(`Furniture with ID ${id} not found`);
    }

    return furniture;
  }

  async update(id: string, updateFurnitureDto: UpdateFurnitureDto) {
    await this.findOneAdmin(id);
    
    const { variations, images, imageUrl, updateImageUrl, ...furnitureData } = updateFurnitureDto;
    
    return this.prisma.$transaction(async (prisma) => {
      const updatedFurniture = await prisma.furniture.update({
        where: { id },
        data: {
          ...furnitureData,
          variations: variations && variations.length > 0 ? {
            deleteMany: {},
            create: variations,
          } : undefined,
        },
        include: {
          variations: true,
          images: {
            orderBy: {
              position: 'asc'
            }
          },
        },
      });

      if (images && images.length > 0) {
        const existingImages = await prisma.furnitureImage.findMany({
          where: { furnitureId: id },
          select: { id: true, url: true, position: true }
        });

        for (const img of images) {
          if (img.id) {
            let imageToUpdate = existingImages.find(existing => existing.id === img.id);
            
            if (!imageToUpdate) {
              imageToUpdate = existingImages.find(existing => 
                existing.url === img.url || 
                existing.url.includes(img.url) || 
                img.url.includes(existing.url)
              );
            }

            if (imageToUpdate) {
              await prisma.furnitureImage.update({
                where: { id: imageToUpdate.id },
                data: { 
                  position: img.position,
                  url: img.url
                },
              });
            }
          } else {
            await prisma.furnitureImage.create({
              data: {
                url: img.url,
                position: img.position,
                furnitureId: id,
              },
            });
          }

          if (img.isDeleted && img.id) {
            const imageToDelete = existingImages.find(existing => existing.id === img.id);
            if (imageToDelete) {
              await prisma.furnitureImage.delete({
                where: { id: imageToDelete.id },
              });
            }
          }
        }
      }

      return prisma.furniture.findUnique({
        where: { id },
        include: {
          variations: true,
          images: {
            orderBy: {
              position: 'asc'
            }
          },
        },
      });
    });
  }

  // Adicionar imagens a um furniture
  async addImages(furnitureId: string, images: Array<{ url: string; position: number }>) {
    await this.findOneAdmin(furnitureId);
    
    const createdImages = await this.prisma.furnitureImage.createMany({
      data: images.map(img => ({
        url: img.url,
        position: img.position,
        furnitureId,
      })),
    });
    
    return this.findOneAdmin(furnitureId);
  }

  // Atualizar posições das imagens
  async updateImagePositions(
    furnitureId: string,
    images: Array<{ id: string; position: number }>
  ) {
    console.log('Service: updateImagePositions called');
    console.log('Service: furnitureId =', furnitureId);
    console.log('Service: images to update =', images);
    
    await this.findOneAdmin(furnitureId);
    
    const existingImages = await this.prisma.furnitureImage.findMany({
      where: { furnitureId },
      select: { id: true, url: true, position: true }
    });
    
    console.log('Service: existing images in database:', existingImages);
    
    let updatedCount = 0;
    
    for (const img of images) {
      // First try to find by exact ID match
      let imageToUpdate = existingImages.find(existing => existing.id === img.id);
      
      // If not found by ID, try to find by URL (for externally hosted images)
      if (!imageToUpdate) {
        console.log(`Service: Image with ID ${img.id} not found, trying to match by URL pattern...`);
        
        // Try to match by URL if the ID might be a URL or partial URL
        imageToUpdate = existingImages.find(existing => {
          return existing.url === img.id || 
                 existing.url.includes(img.id) || 
                 existing.id.includes(img.id)
        });
      }
      
      if (!imageToUpdate) {
        console.warn(`Service: Image with ID/URL ${img.id} not found in database, skipping...`);
        console.warn('Service: Available images:', existingImages.map(img => ({ id: img.id, url: img.url })));
        continue;
      }
      
      console.log(`Service: Updating image ${imageToUpdate.id} (${imageToUpdate.url}) from position ${imageToUpdate.position} to ${img.position}`);
      
      try {
        const updateResult = await this.prisma.furnitureImage.update({
          where: { id: imageToUpdate.id },
          data: { position: img.position },
        });
        console.log(`Service: Update result for ${imageToUpdate.id}:`, { id: updateResult.id, position: updateResult.position });
        updatedCount++;
      } catch (error) {
        console.error(`Service: Failed to update image ${imageToUpdate.id}:`, error);
        throw error;
      }
    }
    
    console.log(`Service: Successfully updated ${updatedCount} images`);
    
    const result = await this.findOneAdmin(furnitureId);
    console.log('Service: Final furniture data:', result.images?.map(img => ({ id: img.id, position: img.position, url: img.url.substring(0, 50) + '...' })));
    
    return result;
  }

  // Remover uma imagem específica
  async removeImage(imageId: string) {
    // First try to find by direct ID
    let image = await this.prisma.furnitureImage.findUnique({
      where: { id: imageId },
    });
    
    // If not found, try to find by the filename in the URL
    if (!image) {
      const allImages = await this.prisma.furnitureImage.findMany();
      
      // Try to match either by full filename or partial UUID in URL
      image = allImages.find(img => {
        const filename = img.url.split('/').pop();
        return filename === imageId || 
               (filename && filename.includes(imageId)) || 
               (imageId && img.url.includes(imageId));
      });
      
      if (!image) {
        throw new NotFoundException(`Image with ID ${imageId} not found`);
      }
    }
    
    // Delete the physical file
    try {
      const filename = image.url.split('/').pop();
      if (filename) {
        const filePath = join(process.cwd(), 'uploads', filename);
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('Error deleting image file:', error);
    }
    
    // Delete from database
    await this.prisma.furnitureImage.delete({
      where: { id: image.id },
    });
    
    // Return updated furniture
    return this.findOneAdmin(image.furnitureId);
  }

  async remove(id: string) {
    const furniture = await this.findOneAdmin(id);
    
    try {
      for (const image of furniture.images) {
        const filename = image.url.split('/').pop();
        if (filename) {
          const filePath = join(process.cwd(), 'uploads', filename);
          if (existsSync(filePath)) {
            unlinkSync(filePath);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting image files:', error);
      // Continua mesmo se não conseguir deletar os arquivos
    }
    
    return this.prisma.furniture.delete({
      where: { id },
    });
  }
}