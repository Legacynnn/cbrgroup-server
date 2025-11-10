import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ContactsService } from './contacts.service'
import { CreateContactTicketDto, UpdateContactTicketDto } from './dto'
import { JwtAuthGuard } from '../auth/auth.guard'
import { ContactTicketStatus } from '@prisma/client'

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createContactTicketDto: CreateContactTicketDto) {
    return this.contactsService.create(createContactTicketDto)
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  async findAllAdmin(@Query('includeHistory') includeHistory?: string) {
    return this.contactsService.findAll(includeHistory === 'true')
  }

  @Get('admin/by-status')
  @UseGuards(JwtAuthGuard)
  async getTicketsByStatus() {
    return this.contactsService.getTicketsByStatus()
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  async getTicketStats() {
    return this.contactsService.getTicketStats()
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Query('includeHistory') includeHistory?: string) {
    return this.contactsService.findOne(id, includeHistory === 'true')
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateContactTicketDto: UpdateContactTicketDto,
  ) {
    return this.contactsService.update(id, updateContactTicketDto)
  }

  @Patch('admin/:id/position')
  @UseGuards(JwtAuthGuard)
  async updateBoardPosition(
    @Param('id') id: string,
    @Body() body: { status: ContactTicketStatus; boardPosition: number },
  ) {
    return this.contactsService.updateBoardPosition(id, body.status, body.boardPosition)
  }
}

