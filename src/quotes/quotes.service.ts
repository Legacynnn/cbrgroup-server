import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { 
  CreateQuoteDto, 
  UpdateQuoteDto,
  UpdateQuoteStatusDto, 
  UpdateQuoteBoardPositionDto,
  QuotePaginationQueryDto,
  QuotePaginationResponseDto,
  QuoteResponseDto 
} from './dto/quote.dto';
import { QuoteStatus, QuoteHistoryAction } from '@prisma/client';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  private async createHistoryEntry(
    quoteId: string,
    action: QuoteHistoryAction,
    description: string,
    oldValue?: any,
    newValue?: any,
    performedBy?: string,
    prismaInstance?: any
  ) {
    const prisma = prismaInstance || this.prisma;
    return prisma.quoteHistory.create({
      data: {
        quoteId,
        action,
        description,
        oldValue,
        newValue,
        performedBy: performedBy || 'system'
      }
    });
  }

  async create(createQuoteDto: CreateQuoteDto): Promise<QuoteResponseDto> {
    const { items, ...quoteData } = createQuoteDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Quote must contain at least one item');
    }

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    const maxPosition = await this.prisma.quote.findFirst({
      where: { status: QuoteStatus.OPEN },
      orderBy: { boardPosition: 'desc' },
      select: { boardPosition: true }
    });

    const boardPosition = maxPosition ? maxPosition.boardPosition + 1 : 0;

    return this.prisma.$transaction(async (prisma) => {
      const quote = await prisma.quote.create({
        data: {
          ...quoteData,
          totalItems,
          boardPosition,
          items: {
            create: items.map(item => ({
              furnitureId: item.furnitureId,
              furnitureName: item.furnitureName,
              category: item.category,
              size: item.size,
              color: item.color,
              colorCode: item.colorCode,
              variationId: item.variationId,
              imageUrl: item.imageUrl,
              quantity: item.quantity,
            }))
          }
        },
        include: {
          items: true
        }
      });

      await this.createHistoryEntry(
        quote.id,
        QuoteHistoryAction.CREATED,
        `Quote created by ${quoteData.customerName} with ${totalItems} items`,
        null,
        { totalItems, status: quote.status },
        'customer',
        prisma
      );

      return this.formatQuoteResponse(quote);
    });
  }

  async findAll(query: QuotePaginationQueryDto): Promise<QuotePaginationResponseDto<QuoteResponseDto>> {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { postcode: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    const orderBy: any = {};
    if (sortBy === 'boardPosition') {
      orderBy.boardPosition = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [quotes, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          items: true
        }
      }),
      this.prisma.quote.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      data: quotes.map(quote => this.formatQuoteResponse(quote)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
      filters: {
        status,
        search,
        sortBy,
        sortOrder
      }
    };
  }

  async findOne(id: string, includeHistory: boolean = false): Promise<QuoteResponseDto> {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        items: true,
        history: includeHistory ? {
          orderBy: { createdAt: 'desc' }
        } : false
      }
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    return this.formatQuoteResponse(quote);
  }

  async update(id: string, updateQuoteDto: UpdateQuoteDto, performedBy?: string): Promise<QuoteResponseDto> {
    const existingQuote = await this.prisma.quote.findUnique({
      where: { id }
    });

    if (!existingQuote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    const changes: string[] = [];
    const oldValues: any = {};
    const newValues: any = {};

    Object.keys(updateQuoteDto).forEach(key => {
      const oldValue = existingQuote[key];
      const newValue = updateQuoteDto[key];
      if (oldValue !== newValue && newValue !== undefined) {
        changes.push(key);
        oldValues[key] = oldValue;
        newValues[key] = newValue;
      }
    });

    if (changes.length === 0) {
      return this.formatQuoteResponse(existingQuote);
    }

    return this.prisma.$transaction(async (prisma) => {
      const updatedQuote = await prisma.quote.update({
        where: { id },
        data: updateQuoteDto,
        include: {
          items: true,
          history: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      await this.createHistoryEntry(
        id,
        QuoteHistoryAction.CUSTOMER_INFO_UPDATED,
        `Updated ${changes.join(', ')}`,
        oldValues,
        newValues,
        performedBy || 'admin',
        prisma
      );

      return this.formatQuoteResponse(updatedQuote);
    });
  }

  async updateStatus(id: string, updateQuoteStatusDto: UpdateQuoteStatusDto, performedBy?: string): Promise<QuoteResponseDto> {
    const existingQuote = await this.prisma.quote.findUnique({
      where: { id }
    });

    if (!existingQuote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    let newBoardPosition = existingQuote.boardPosition;

    if (existingQuote.status !== updateQuoteStatusDto.status) {
      const maxPosition = await this.prisma.quote.findFirst({
        where: { status: updateQuoteStatusDto.status },
        orderBy: { boardPosition: 'desc' },
        select: { boardPosition: true }
      });

      newBoardPosition = maxPosition ? maxPosition.boardPosition + 1 : 0;
    }

    return this.prisma.$transaction(async (prisma) => {
      const updatedQuote = await prisma.quote.update({
        where: { id },
        data: {
          status: updateQuoteStatusDto.status,
          adminNotes: updateQuoteStatusDto.adminNotes,
          boardPosition: newBoardPosition,
        },
        include: {
          items: true,
          history: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      const changes: string[] = [];
      const oldValues: any = {};
      const newValues: any = {};

      if (existingQuote.status !== updateQuoteStatusDto.status) {
        changes.push('status');
        oldValues.status = existingQuote.status;
        newValues.status = updateQuoteStatusDto.status;
      }

      if (existingQuote.adminNotes !== updateQuoteStatusDto.adminNotes) {
        changes.push('admin notes');
        oldValues.adminNotes = existingQuote.adminNotes;
        newValues.adminNotes = updateQuoteStatusDto.adminNotes;
      }

      if (existingQuote.boardPosition !== newBoardPosition) {
        changes.push('board position');
        oldValues.boardPosition = existingQuote.boardPosition;
        newValues.boardPosition = newBoardPosition;
      }

      if (changes.length > 0) {
        await this.createHistoryEntry(
          id,
          QuoteHistoryAction.STATUS_CHANGED,
          `Changed ${changes.join(', ')}`,
          oldValues,
          newValues,
          performedBy || 'admin',
          prisma
        );
      }

      return this.formatQuoteResponse(updatedQuote);
    });
  }

  async updateBoardPosition(id: string, updateBoardPositionDto: UpdateQuoteBoardPositionDto, performedBy?: string): Promise<QuoteResponseDto> {
    const quote = await this.prisma.quote.findUnique({
      where: { id }
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    return this.prisma.$transaction(async (prisma) => {
      if (quote.status !== updateBoardPositionDto.status) {
        const quotesInNewStatus = await prisma.quote.findMany({
          where: { status: updateBoardPositionDto.status },
          orderBy: { boardPosition: 'asc' }
        });

        for (let i = updateBoardPositionDto.boardPosition; i < quotesInNewStatus.length; i++) {
          await prisma.quote.update({
            where: { id: quotesInNewStatus[i].id },
            data: { boardPosition: i + 1 }
          });
        }

        const quotesInOldStatus = await prisma.quote.findMany({
          where: { 
            status: quote.status,
            boardPosition: { gt: quote.boardPosition }
          },
          orderBy: { boardPosition: 'asc' }
        });

        for (let i = 0; i < quotesInOldStatus.length; i++) {
          await prisma.quote.update({
            where: { id: quotesInOldStatus[i].id },
            data: { boardPosition: quote.boardPosition + i }
          });
        }
      } else {
        const quotesInSameStatus = await prisma.quote.findMany({
          where: { 
            status: updateBoardPositionDto.status,
            id: { not: id }
          },
          orderBy: { boardPosition: 'asc' }
        });

        const oldPosition = quote.boardPosition;
        const newPosition = updateBoardPositionDto.boardPosition;

        if (newPosition > oldPosition) {
          for (const q of quotesInSameStatus) {
            if (q.boardPosition > oldPosition && q.boardPosition <= newPosition) {
              await prisma.quote.update({
                where: { id: q.id },
                data: { boardPosition: q.boardPosition - 1 }
              });
            }
          }
        } else if (newPosition < oldPosition) {
          for (const q of quotesInSameStatus) {
            if (q.boardPosition >= newPosition && q.boardPosition < oldPosition) {
              await prisma.quote.update({
                where: { id: q.id },
                data: { boardPosition: q.boardPosition + 1 }
              });
            }
          }
        }
      }

      const updatedQuote = await prisma.quote.update({
        where: { id },
        data: {
          status: updateBoardPositionDto.status,
          boardPosition: updateBoardPositionDto.boardPosition,
        },
        include: {
          items: true,
          history: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      await this.createHistoryEntry(
        id,
        QuoteHistoryAction.POSITION_CHANGED,
        `Moved to position ${updateBoardPositionDto.boardPosition} in ${updateBoardPositionDto.status} column`,
        {
          oldStatus: quote.status,
          oldPosition: quote.boardPosition
        },
        {
          newStatus: updateBoardPositionDto.status,
          newPosition: updateBoardPositionDto.boardPosition
        },
        performedBy || 'admin',
        prisma
      );

      return this.formatQuoteResponse(updatedQuote);
    });
  }

  async remove(id: string): Promise<void> {
    const quote = await this.prisma.quote.findUnique({
      where: { id }
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.quote.delete({
        where: { id }
      });

      const quotesToReorder = await prisma.quote.findMany({
        where: { 
          status: quote.status,
          boardPosition: { gt: quote.boardPosition }
        },
        orderBy: { boardPosition: 'asc' }
      });

      for (let i = 0; i < quotesToReorder.length; i++) {
        await prisma.quote.update({
          where: { id: quotesToReorder[i].id },
          data: { boardPosition: quote.boardPosition + i }
        });
      }
    });
  }

  async getQuotesByStatus(): Promise<Record<string, QuoteResponseDto[]>> {
    const quotes = await this.prisma.quote.findMany({
      include: {
        items: true
      },
      orderBy: [
        { status: 'asc' },
        { boardPosition: 'asc' }
      ]
    });

    const quotesByStatus: Record<string, QuoteResponseDto[]> = {};

    for (const status of Object.values(QuoteStatus)) {
      quotesByStatus[status] = quotes
        .filter(quote => quote.status === status)
        .map(quote => this.formatQuoteResponse(quote));
    }

    return quotesByStatus;
  }

  async getQuoteStats() {
    const stats = await this.prisma.quote.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const totalQuotes = await this.prisma.quote.count();
    const recentQuotes = await this.prisma.quote.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    return {
      total: totalQuotes,
      recent: recentQuotes,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  private formatQuoteResponse(quote: any): QuoteResponseDto {
    return {
      id: quote.id,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerPhone: quote.customerPhone,
      postcode: quote.postcode,
      address: quote.address,
      message: quote.message,
      status: quote.status,
      boardPosition: quote.boardPosition,
      totalItems: quote.totalItems,
      adminNotes: quote.adminNotes,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
      items: quote.items.map(item => ({
        id: item.id,
        furnitureId: item.furnitureId,
        furnitureName: item.furnitureName,
        category: item.category,
        size: item.size,
        color: item.color,
        colorCode: item.colorCode,
        variationId: item.variationId,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        createdAt: item.createdAt,
      })),
      history: quote.history?.map(h => ({
        id: h.id,
        action: h.action,
        description: h.description,
        oldValue: h.oldValue,
        newValue: h.newValue,
        performedBy: h.performedBy,
        timestamp: h.createdAt,
      }))
    };
  }
} 