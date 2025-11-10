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
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { v4 as uuid } from 'uuid'
import { extname, join } from 'path'
import { JwtAuthGuard } from '../auth/auth.guard'
import { BrandsService } from './brands.service'
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto'

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post('upload/cover')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('cover', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (req, file, callback) => {
          const uniqueName = uuid()
          const ext = extname(file.originalname)
          callback(null, `${uniqueName}${ext}`)
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(new Error('Only images are allowed!'), false)
        }
        callback(null, true)
      },
    }),
  )
  async uploadCover(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      const baseUrl =
        process.env.API_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://cbrdesigngroup.com'
          : `http://localhost:${process.env.PORT || 3333}`)

      const coverUrl = `${baseUrl}/uploads/${file.filename}`

      return {
        url: coverUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
      }
    } catch (error) {
      console.error('Error uploading brand cover image:', error)
      throw new HttpException(
        error.message || 'Failed to upload cover image',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Post('upload/logo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (req, file, callback) => {
          const uniqueName = uuid()
          const ext = extname(file.originalname)
          callback(null, `${uniqueName}${ext}`)
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(new Error('Only images are allowed!'), false)
        }
        callback(null, true)
      },
    }),
  )
  async uploadLogo(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      const baseUrl =
        process.env.API_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://cbrdesigngroup.com'
          : `http://localhost:${process.env.PORT || 3333}`)

      const logoUrl = `${baseUrl}/uploads/${file.filename}`

      return {
        url: logoUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
      }
    } catch (error) {
      console.error('Error uploading brand logo image:', error)
      throw new HttpException(
        error.message || 'Failed to upload logo image',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createBrandDto: CreateBrandDto) {
    try {
      return this.brandsService.create(createBrandDto)
    } catch (error) {
      console.error('Error creating brand:', error)
      throw new HttpException(
        error.message || 'Failed to create brand',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get()
  async findAll() {
    return this.brandsService.findAll()
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  async findAllAdmin() {
    return this.brandsService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return this.brandsService.findOne(id)
    } catch (error) {
      console.error('Error fetching brand:', error)
      throw new HttpException(
        error.message || 'Failed to fetch brand',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    try {
      return this.brandsService.update(id, updateBrandDto)
    } catch (error) {
      console.error('Error updating brand:', error)
      throw new HttpException(
        error.message || 'Failed to update brand',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    try {
      return this.brandsService.remove(id)
    } catch (error) {
      console.error('Error deleting brand:', error)
      throw new HttpException(
        error.message || 'Failed to delete brand',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}

