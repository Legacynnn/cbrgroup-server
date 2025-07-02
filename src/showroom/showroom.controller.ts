import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/auth.guard';
import { ShowroomService } from './showroom.service';
import { CreateShowroomImageDto, UpdateShowroomImageDto } from './dto/showroom.dto';

@Controller('showroom')
export class ShowroomController {
  constructor(private readonly showroomService: ShowroomService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
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
        files: 10,
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(new Error('Apenas imagens são permitidas!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadImages(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    files: Express.Multer.File[],
    @Body() body: { title?: string; description?: string },
  ) {
    try {
      const baseUrl = 'http://localhost:3333';
      
      const existingImages = await this.showroomService.findAll();
      const lastPosition = existingImages.length > 0 
        ? Math.max(...existingImages.map(img => img.position)) 
        : -1;
      
      const imagesToCreate = files.map((file, index) => ({
        url: `${baseUrl}/uploads/${file.filename}`,
        position: lastPosition + 1 + index,
        title: body.title || undefined,
        description: body.description || undefined,
      }));
      
      return this.showroomService.createImages(imagesToCreate);
    } catch (error) {
      console.error('Error uploading showroom images:', error);
      throw new HttpException(
        error.message || 'Failed to upload images',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('url')
  @UseGuards(JwtAuthGuard)
  async addImageUrls(@Body() createDto: CreateShowroomImageDto) {
    try {
      if (!createDto.images || !Array.isArray(createDto.images) || createDto.images.length === 0) {
        throw new HttpException('Images array is required', HttpStatus.BAD_REQUEST);
      }

      for (const image of createDto.images) {
        if (!image.url || typeof image.url !== 'string') {
          throw new HttpException('Valid image URL is required', HttpStatus.BAD_REQUEST);
        }

        const url = image.url.trim();
        if (!url.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i)) {
          throw new HttpException('URL must be a valid image URL (jpg, jpeg, png, webp, gif)', HttpStatus.BAD_REQUEST);
        }
      }

      const existingImages = await this.showroomService.findAll();
      const lastPosition = existingImages.length > 0 
        ? Math.max(...existingImages.map(img => img.position)) 
        : -1;

      const imagesToCreate = createDto.images.map((image, index) => ({
        url: image.url.trim(),
        position: image.position !== undefined ? image.position : lastPosition + 1 + index,
        title: image.title || undefined,
        description: image.description || undefined,
      }));

      return this.showroomService.createImages(imagesToCreate);
    } catch (error) {
      console.error('Error adding showroom image URLs:', error);
      throw new HttpException(
        error.message || 'Failed to add image URLs',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll() {
    return this.showroomService.findAll();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  async findAllAdmin() {
    return this.showroomService.findAll();
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateShowroomImageDto,
  ) {
    try {
      return this.showroomService.update(id, updateDto);
    } catch (error) {
      console.error('Error updating showroom image:', error);
      throw new HttpException(
        error.message || 'Failed to update image',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('positions')
  @UseGuards(JwtAuthGuard)
  async updatePositions(
    @Body() updateData: { images: Array<{ id: string; position: number }> },
  ) {
    try {
      if (!updateData || !updateData.images || !Array.isArray(updateData.images)) {
        throw new HttpException('Invalid update data', HttpStatus.BAD_REQUEST);
      }
      
      return this.showroomService.updatePositions(updateData.images);
    } catch (error) {
      console.error('Error updating showroom image positions:', error);
      throw new HttpException(
        error.message || 'Failed to update image positions',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    try {
      return this.showroomService.remove(id);
    } catch (error) {
      console.error('Error deleting showroom image:', error);
      throw new HttpException(
        error.message || 'Failed to delete image',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 