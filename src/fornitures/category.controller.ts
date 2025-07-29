import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import { extname } from 'path';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto, UpdateCategoryImageDto, MergeCategoriesDto } from './dto/category.dto';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Patch(':id/featured')
  @UseGuards(JwtAuthGuard)
  updateFeatured(@Param('id') id: string, @Body() body: { featured: boolean }) {
    return this.categoryService.updateFeatured(id, body.featured);
  }

  @Patch(':id/image')
  @UseGuards(JwtAuthGuard)
  updateImage(@Param('id') id: string, @Body() updateCategoryImageDto: UpdateCategoryImageDto) {
    return this.categoryService.updateImage(id, updateCategoryImageDto);
  }

  @Post(':id/upload-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueName = uuid();
          const ext = extname(file.originalname);
          callback(null, `${uniqueName}${ext}`);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(new Error('Only images are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      await this.categoryService.findOne(id);

      const baseUrl = process.env.API_URL;
      const imageUrl = `${baseUrl}/uploads/${file.filename}`;
      
      return this.categoryService.updateImage(id, { imageUrl });
    } catch (error) {
      console.error('Error uploading category image:', error);
      throw new HttpException(
        error.message || 'Failed to upload category image',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  mergeCategories(@Body() mergeCategoriesDto: MergeCategoriesDto) {
    return this.categoryService.mergeCategories(mergeCategoriesDto);
  }
} 