import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCategoryDto, UpdateCategoryDto, UpdateCategoryImageDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      const category = await this.prisma.category.create({
        data: createCategoryDto,
        include: {
          _count: {
            select: { furniture: true }
          }
        }
      });
      return category;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Category with this name already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        _count: {
          select: { furniture: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { furniture: true }
        }
      }
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);
    
    try {
      return this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
        include: {
          _count: {
            select: { furniture: true }
          }
        }
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Category with this name already exists');
      }
      throw error;
    }
  }

  async updateImage(id: string, updateCategoryImageDto: UpdateCategoryImageDto) {
    await this.findOne(id);
    
    return this.prisma.category.update({
      where: { id },
      data: {
        imageUrl: updateCategoryImageDto.imageUrl
      },
      include: {
        _count: {
          select: { furniture: true }
        }
      }
    });
  }

  async updateFeatured(id: string, featured: boolean) {
    await this.findOne(id);
    
    return this.prisma.category.update({
      where: { id },
      data: { featured },
      include: {
        _count: {
          select: { furniture: true }
        }
      }
    });
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    
    const furnitureCount = await this.prisma.furniture.count({
      where: { categoryId: id }
    });

    if (furnitureCount > 0) {
      throw new BadRequestException(
        `Cannot delete category. It has ${furnitureCount} furniture items associated with it.`
      );
    }

    return this.prisma.category.delete({
      where: { id }
    });
  }
} 