import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateShowroomImageDto } from './dto/showroom.dto';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class ShowroomService {
  constructor(private prisma: PrismaService) {}

  async createImages(images: Array<{ url: string; position: number; title?: string; description?: string }>) {
    const createdImages = await this.prisma.showroomImage.createMany({
      data: images,
    });

    return this.findAll();
  }

  async findAll() {
    return this.prisma.showroomImage.findMany({
      orderBy: {
        position: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const image = await this.prisma.showroomImage.findUnique({
      where: { id },
    });

    if (!image) {
      throw new NotFoundException(`Showroom image with ID ${id} not found`);
    }

    return image;
  }

  async update(id: string, updateDto: UpdateShowroomImageDto) {
    await this.findOne(id);

    return this.prisma.showroomImage.update({
      where: { id },
      data: updateDto,
    });
  }

  async updatePositions(images: Array<{ id: string; position: number }>) {
    const existingImages = await this.prisma.showroomImage.findMany({
      select: { id: true, position: true },
    });

    for (const img of images) {
      const imageToUpdate = existingImages.find(existing => existing.id === img.id);
      
      if (!imageToUpdate) {
        console.warn(`Showroom image with ID ${img.id} not found, skipping...`);
        continue;
      }

      await this.prisma.showroomImage.update({
        where: { id: imageToUpdate.id },
        data: { position: img.position },
      });
    }

    return this.findAll();
  }

  async remove(id: string) {
    const image = await this.findOne(id);

    try {
      const filename = image.url.split('/').pop();
      if (filename) {
        const filePath = join(process.cwd(), 'uploads', filename);
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('Error deleting showroom image file:', error);
    }

    await this.prisma.showroomImage.delete({
      where: { id },
    });

    return { message: 'Showroom image deleted successfully' };
  }
} 