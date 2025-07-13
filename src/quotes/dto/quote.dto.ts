import { IsString, IsEmail, IsOptional, IsArray, ValidateNested, IsInt, Min, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export enum QuoteStatus {
  OPEN = 'OPEN',
  ANSWERED = 'ANSWERED',
  BUDGET_WAITING = 'BUDGET_WAITING',
  BUDGET_ACCEPTED = 'BUDGET_ACCEPTED',
  BUDGET_DENIED = 'BUDGET_DENIED',
  DELIVERED = 'DELIVERED'
}

export enum QuoteHistoryAction {
  CREATED = 'CREATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  POSITION_CHANGED = 'POSITION_CHANGED',
  ADMIN_NOTES_UPDATED = 'ADMIN_NOTES_UPDATED',
  CUSTOMER_INFO_UPDATED = 'CUSTOMER_INFO_UPDATED',
  ITEMS_UPDATED = 'ITEMS_UPDATED'
}

export class CreateQuoteItemDto {
  @IsString()
  furnitureId: string;

  @IsString()
  furnitureName: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  colorCode?: string;

  @IsOptional()
  @IsString()
  variationId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateQuoteDto {
  @IsString()
  customerName: string;

  @IsEmail()
  customerEmail: string;

  @IsString()
  customerPhone: string;

  @IsString()
  postcode: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteItemDto)
  items: CreateQuoteItemDto[];
}

export class UpdateQuoteStatusDto {
  @IsEnum(QuoteStatus)
  status: QuoteStatus;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class UpdateQuoteBoardPositionDto {
  @IsInt()
  @Min(0)
  boardPosition: number;

  @IsEnum(QuoteStatus)
  status: QuoteStatus;
}

export class UpdateQuoteDto {
  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  postcode?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class QuoteItemResponseDto {
  id: string;
  furnitureId: string;
  furnitureName: string;
  category: string;
  size?: string;
  color?: string;
  colorCode?: string;
  variationId?: string;
  imageUrl?: string;
  quantity: number;
  createdAt: Date;
}

export class QuoteHistoryResponseDto {
  id: string;
  action: QuoteHistoryAction;
  description: string;
  oldValue?: any;
  newValue?: any;
  performedBy?: string;
  timestamp: Date;
}

export class QuoteResponseDto {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  postcode: string;
  address: string;
  message?: string;
  status: QuoteStatus;
  boardPosition: number;
  totalItems: number;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  items: QuoteItemResponseDto[];
  history?: QuoteHistoryResponseDto[];
}

export class QuotePaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class QuotePaginationResponseDto<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    status?: QuoteStatus;
    search?: string;
    sortBy: string;
    sortOrder: string;
  };
} 