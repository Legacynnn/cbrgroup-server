import {
  Controller,
  Post,
  Param,
  Delete,
  Put,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/auth.guard';
import { FurnitureService } from './fornitures.service';

@Controller('furniture-images')
export class FurnitureImagesController {
  constructor(private readonly furnitureService: FurnitureService) {}

  @Post(':furnitureId')
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
        fileSize: 50 * 1024 * 1024, // 5MB
        files: 10, // Máximo 10 arquivos
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
    @Param('furnitureId') furnitureId: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    files: Express.Multer.File[],
  ) {
    try {
      await this.furnitureService.findOne(furnitureId);

      const baseUrl = process.env.API_URL
      
      const existingFurniture = await this.furnitureService.findOne(furnitureId);
      const lastPosition = existingFurniture.images.length > 0 
        ? Math.max(...existingFurniture.images.map(img => img.position)) 
        : -1;
      
      const images = files.map((file, index) => ({
        url: `${baseUrl}/uploads/${file.filename}`,
        position: lastPosition + 1 + index
      }));
      
      return this.furnitureService.addImages(furnitureId, images);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new HttpException(
        error.message || 'Failed to upload images',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':furnitureId/url')
  @UseGuards(JwtAuthGuard)
  async addImageUrls(
    @Param('furnitureId') furnitureId: string,
    @Body() body: { images: Array<{ url: string; position: number }> },
  ) {
    try {
      await this.furnitureService.findOne(furnitureId);

      if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
        throw new HttpException('Images array is required', HttpStatus.BAD_REQUEST);
      }

      for (const image of body.images) {
        if (!image.url || typeof image.url !== 'string') {
          throw new HttpException('Valid image URL is required', HttpStatus.BAD_REQUEST);
        }

        const url = image.url.trim();
        if (!url.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i)) {
          throw new HttpException('URL must be a valid image URL (jpg, jpeg, png, webp, gif)', HttpStatus.BAD_REQUEST);
        }
      }

      const existingFurniture = await this.furnitureService.findOne(furnitureId);
      const lastPosition = existingFurniture.images.length > 0 
        ? Math.max(...existingFurniture.images.map(img => img.position)) 
        : -1;

      const images = body.images.map((image, index) => ({
        url: image.url.trim(),
        position: image.position !== undefined ? image.position : lastPosition + 1 + index
      }));

      return this.furnitureService.addImages(furnitureId, images);
    } catch (error) {
      console.error('Error adding image URLs:', error);
      throw new HttpException(
        error.message || 'Failed to add image URLs',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':furnitureId/positions')
  @UseGuards(JwtAuthGuard)
  async updatePositions(
    @Param('furnitureId') furnitureId: string,
    @Body() updateData: { images: Array<{ id: string; position: number }> },
  ) {
    try {
      console.log('=== Position Update Request ===');
      console.log('Furniture ID:', furnitureId);
      console.log('Update data received:', JSON.stringify(updateData, null, 2));
      
      if (!updateData || !updateData.images || !Array.isArray(updateData.images)) {
        console.log('Invalid update data structure');
        throw new HttpException('Invalid update data', HttpStatus.BAD_REQUEST);
      }
      
      console.log('Calling updateImagePositions service...');
      const result = await this.furnitureService.updateImagePositions(
        furnitureId,
        updateData.images,
      );
      
      console.log('Position update result:', result ? 'Success' : 'Failed');
      console.log('Updated furniture images:', result.images?.map((img: any) => ({ id: img.id, position: img.position })));
      console.log('=== Position Update Complete ===');
      
      return result;
    } catch (error) {
      console.error('Error updating image positions:', error);
      throw new HttpException(
        error.message || 'Failed to update image positions',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':imageId')
  @UseGuards(JwtAuthGuard)
  async removeImage(@Param('imageId') imageId: string) {
    try {
      return this.furnitureService.removeImage(imageId);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new HttpException(
        error.message || 'Failed to delete image',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('texture/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('texture', 1, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueName = uuid();
          const ext = extname(file.originalname);
          callback(null, `texture-${uniqueName}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1,
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(new Error('Only images are allowed for textures!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadTextureImage(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    files: Express.Multer.File[],
  ) {
    try {
      const file = files[0];
      const baseUrl = process.env.API_URL;
      const textureUrl = `${baseUrl}/uploads/${file.filename}`;
      
      return {
        url: textureUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
      };
    } catch (error) {
      console.error('Error uploading texture image:', error);
      throw new HttpException(
        error.message || 'Failed to upload texture image',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}