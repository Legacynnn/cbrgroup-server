import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateFurnitureDto } from './dto/create-forniture.dto';
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