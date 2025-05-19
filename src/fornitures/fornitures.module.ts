import { Module } from '@nestjs/common';
import { FurnitureController } from './fornitures.controller';
import { FurnitureImagesController } from './furniture-images.controller';
import { FurnitureService } from './fornitures.service';
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
  controllers: [FurnitureController, FurnitureImagesController],
  providers: [FurnitureService, PrismaService],
})
export class FurnitureModule {}