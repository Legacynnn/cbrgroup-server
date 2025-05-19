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
        // Aceita apenas imagens
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
      // Primeiro verifica se o furniture existe
      await this.furnitureService.findOne(furnitureId);

      // Processa as imagens carregadas
      const baseUrl = process.env.API_URL || 'http://localhost:3333';
      
      // Recebe o último índice das imagens existentes
      const existingFurniture = await this.furnitureService.findOne(furnitureId);
      const lastPosition = existingFurniture.images.length > 0 
        ? Math.max(...existingFurniture.images.map(img => img.position)) 
        : -1;
      
      // Cria objetos de imagem para cada arquivo
      const images = files.map((file, index) => ({
        url: `${baseUrl}/uploads/${file.filename}`,
        position: lastPosition + 1 + index // Continua a partir da última posição
      }));
      
      // Salva as imagens no banco
      return this.furnitureService.addImages(furnitureId, images);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new HttpException(
        error.message || 'Failed to upload images',
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
      return this.furnitureService.updateImagePositions(
        furnitureId,
        updateData.images,
      );
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
}