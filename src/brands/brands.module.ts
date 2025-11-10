import { Module } from '@nestjs/common'
import { BrandsController } from './brands.controller'
import { BrandsService } from './brands.service'
import { PrismaService } from '../prisma.service'
import { MulterModule } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const uploadsDir = join(process.cwd(), 'uploads')

if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true })
}

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: uploadsDir,
      }),
    }),
  ],
  controllers: [BrandsController],
  providers: [BrandsService, PrismaService],
})
export class BrandsModule {}

