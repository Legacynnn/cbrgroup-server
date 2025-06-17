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
} from '@nestjs/common';
import { FurnitureService } from './fornitures.service';
import { CreateFurnitureDto, BulkUpdateStockDto } from './dto/create-forniture.dto';
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

  @Get()
  findAll() {
    return this.furnitureService.findAll();
  }

  @Get('categories')
  findCategories() {
    return this.furnitureService.findCategories();
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.furnitureService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.furnitureService.remove(id);
  }
}