import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { 
  CreateQuoteDto, 
  UpdateQuoteDto,
  UpdateQuoteStatusDto, 
  UpdateQuoteBoardPositionDto,
  QuotePaginationQueryDto
} from './dto/quote.dto';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createQuoteDto: CreateQuoteDto) {
    return this.quotesService.create(createQuoteDto);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  async findAllAdmin(@Query() query: QuotePaginationQueryDto) {
    return this.quotesService.findAll(query);
  }

  @Get('admin/by-status')
  @UseGuards(JwtAuthGuard)
  async getQuotesByStatus() {
    return this.quotesService.getQuotesByStatus();
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  async getQuoteStats() {
    return this.quotesService.getQuoteStats();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Query('includeHistory') includeHistory?: string) {
    return this.quotesService.findOne(id, includeHistory === 'true');
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateQuoteDto: UpdateQuoteDto,
  ) {
    return this.quotesService.update(id, updateQuoteDto);
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateQuoteStatusDto: UpdateQuoteStatusDto,
  ) {
    return this.quotesService.updateStatus(id, updateQuoteStatusDto);
  }

  @Patch('admin/:id/position')
  @UseGuards(JwtAuthGuard)
  async updateBoardPosition(
    @Param('id') id: string,
    @Body() updateBoardPositionDto: UpdateQuoteBoardPositionDto,
  ) {
    return this.quotesService.updateBoardPosition(id, updateBoardPositionDto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.quotesService.remove(id);
  }
} 