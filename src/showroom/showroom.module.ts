import { Module } from '@nestjs/common';
import { ShowroomController } from './showroom.controller';
import { ShowroomService } from './showroom.service';
import { PrismaService } from '../prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const uploadsDir = join(process.cwd(), 'uploads');

if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: uploadsDir,
      }),
    }),
  ],
  controllers: [ShowroomController],
  providers: [ShowroomService, PrismaService],
})
export class ShowroomModule {} 