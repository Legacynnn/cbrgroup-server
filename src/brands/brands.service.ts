import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto'
import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async create(createBrandDto: CreateBrandDto) {
    return this.prisma.brand.create({
      data: createBrandDto,
    })
  }

  async findAll() {
    return this.prisma.brand.findMany({
      orderBy: {
        name: 'asc',
      },
    })
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
    })

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`)
    }

    return brand
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    await this.findOne(id)

    return this.prisma.brand.update({
      where: { id },
      data: updateBrandDto,
    })
  }

  async remove(id: string) {
    const brand = await this.findOne(id)

    try {
      const coverUrlParts = brand.coverUrl.split('/')
      const coverFilename = coverUrlParts[coverUrlParts.length - 1]

      if (coverFilename) {
        const coverFilePath = join(process.cwd(), 'uploads', coverFilename)
        if (existsSync(coverFilePath)) {
          unlinkSync(coverFilePath)
        } else {
          console.warn(`Cover file not found at path: ${coverFilePath}`)
        }
      }

      if (brand.logoUrl) {
        const logoUrlParts = brand.logoUrl.split('/')
        const logoFilename = logoUrlParts[logoUrlParts.length - 1]

        if (logoFilename) {
          const logoFilePath = join(process.cwd(), 'uploads', logoFilename)
          if (existsSync(logoFilePath)) {
            unlinkSync(logoFilePath)
          } else {
            console.warn(`Logo file not found at path: ${logoFilePath}`)
          }
        }
      }
    } catch (error) {
      console.error('Error deleting brand image files:', error)
    }

    await this.prisma.brand.delete({
      where: { id },
    })

    return { message: 'Brand deleted successfully' }
  }
}

