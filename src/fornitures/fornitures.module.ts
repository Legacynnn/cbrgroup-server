import { Module } from '@nestjs/common';
import { FurnitureController } from './fornitures.controller';
import { FurnitureImagesController } from './furniture-images.controller';
import { FurnitureService } from './fornitures.service';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaService } from '../prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
      }),
    }),
  ],
  controllers: [FurnitureController, FurnitureImagesController, CategoryController],
  providers: [FurnitureService, CategoryService, PrismaService],
})
export class FurnitureModule {}