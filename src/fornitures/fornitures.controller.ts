import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  UseGuards,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { FurnitureService } from './fornitures.service';
import { CreateFurnitureDto, BulkUpdateStockDto, PaginationQueryDto, UpdateFeaturedDto, UpdatePriceDto } from './dto/create-forniture.dto';
import { UpdateFurnitureDto } from './dto/update-forniture.dto';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('furniture')
export class FurnitureController {
  constructor(private readonly furnitureService: FurnitureService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createFurnitureDto: CreateFurnitureDto) {
    try {
      return this.furnitureService.create(createFurnitureDto);
    } catch (error) {
      console.error('Error creating furniture:', error);
      throw new HttpException(
        error.message || 'Failed to create furniture',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateFurnitureDto: UpdateFurnitureDto,
  ) {
    try {
      return this.furnitureService.update(id, updateFurnitureDto);
    } catch (error) {
      console.error('Error updating furniture:', error);
      throw new HttpException(
        error.message || 'Failed to update furniture',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  async findAllAdmin(@Query() query: PaginationQueryDto) {
    try {
      return this.furnitureService.findAllWithPagination(query, false, true);
    } catch (error) {
      console.error('Error fetching admin furniture:', error);
      throw new HttpException(
        error.message || 'Failed to fetch furniture',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('in-stock')
  async findInStock(@Query() query: PaginationQueryDto) {
    try {
      return this.furnitureService.findAllWithPagination(query, true, false);
    } catch (error) {
      console.error('Error fetching in-stock furniture:', error);
      throw new HttpException(
        error.message || 'Failed to fetch furniture',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  findAll() {
    return this.furnitureService.findAll();
  }

  @Get('categories')
  findCategories() {
    return this.furnitureService.findCategories();
  }

  @Get('category/:categoryId')
  async findByCategory(@Param('categoryId') categoryId: string) {
    try {
      return this.furnitureService.findByCategory(categoryId);
    } catch (error) {
      console.error('Error fetching furniture by category:', error);
      throw new HttpException(
        error.message || 'Failed to fetch furniture by category',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('producers')
  @UseGuards(JwtAuthGuard)
  findProducers() {
    return this.furnitureService.findProducers();
  }

  @Get('texture-types')
  findTextureTypes() {
    return this.furnitureService.findTextureTypes();
  }

  @Get('featured')
  async getFeaturedFurniture() {
    try {
      return this.furnitureService.getFeaturedFurniture();
    } catch (error) {
      console.error('Error fetching featured furniture:', error);
      throw new HttpException(
        error.message || 'Failed to fetch featured furniture',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('promotions')
  async getPromotionFurniture() {
    try {
      return this.furnitureService.getPromotionFurniture();
    } catch (error) {
      console.error('Error fetching promotion furniture:', error);
      throw new HttpException(
        error.message || 'Failed to fetch promotion furniture',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('bulk-stock')
  @UseGuards(JwtAuthGuard)
  async bulkUpdateStock(@Body() bulkUpdateStockDto: BulkUpdateStockDto) {
    try {
      return await this.furnitureService.bulkUpdateStock(
        bulkUpdateStockDto.furnitureIds,
        bulkUpdateStockDto.inStock
      );
    } catch (error) {
      console.error('Error bulk updating stock:', error);
      throw new HttpException(
        error.message || 'Failed to update furniture stock',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/featured')
  @UseGuards(JwtAuthGuard)
  async updateFeatured(
    @Param('id') id: string,
    @Body() updateFeaturedDto: UpdateFeaturedDto,
  ) {
    try {
      return this.furnitureService.updateFeatured(id, updateFeaturedDto);
    } catch (error) {
      console.error('Error updating featured status:', error);
      throw new HttpException(
        error.message || 'Failed to update featured status',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/price')
  @UseGuards(JwtAuthGuard)
  async updatePrice(
    @Param('id') id: string,
    @Body() updatePriceDto: UpdatePriceDto,
  ) {
    try {
      return this.furnitureService.updatePrice(id, updatePriceDto);
    } catch (error) {
      console.error('Error updating price/promotion:', error);
      throw new HttpException(
        error.message || 'Failed to update price/promotion',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.furnitureService.remove(id);
  }

  @Get(':id/admin')
  @UseGuards(JwtAuthGuard)
  findOneAdmin(@Param('id') id: string) {
    return this.furnitureService.findOneAdmin(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.furnitureService.findOne(id);
  }
}