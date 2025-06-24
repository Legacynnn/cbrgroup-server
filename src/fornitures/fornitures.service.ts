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
    
    return this.prisma.furniture.create({
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
  }

  async findAll() {
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
    inStockOnly: boolean = false
  ): Promise<PaginationResponseDto<any>> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
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

    // Add search functionality
    if (search) {
      where.OR = [
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
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'name' || sortBy === 'category') {
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

      return {
        data: furniture,
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

    return furniture;
  }

  async update(id: string, updateFurnitureDto: UpdateFurnitureDto) {
    await this.findOne(id);
    
    const { variations, images, imageUrl, updateImageUrl, ...furnitureData } = updateFurnitureDto;
    
    return this.prisma.furniture.update({
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
  }

  // Adicionar imagens a um furniture
  async addImages(furnitureId: string, images: Array<{ url: string; position: number }>) {
    await this.findOne(furnitureId);
    
    const createdImages = await this.prisma.furnitureImage.createMany({
      data: images.map(img => ({
        url: img.url,
        position: img.position,
        furnitureId,
      })),
    });
    
    return this.findOne(furnitureId);
  }

  // Atualizar posições das imagens
  async updateImagePositions(
    furnitureId: string,
    images: Array<{ id: string; position: number }>
  ) {
    await this.findOne(furnitureId);
    
    // Atualiza cada imagem individualmente com sua nova posição
    for (const img of images) {
      await this.prisma.furnitureImage.update({
        where: { id: img.id },
        data: { position: img.position },
      });
    }
    
    return this.findOne(furnitureId);
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
    return this.findOne(image.furnitureId);
  }

  async remove(id: string) {
    const furniture = await this.findOne(id);
    
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