export class FurnitureImageDto {
  url: string;
  position: number;
}

export class CreateFurnitureVariationDto {
  color: string;
  colorCode: string;
  imageUrl: string;
  inStock: boolean;
}

export class CreateFurnitureDto {
  name: string;
  size: string | string[];
  description?: string;
  producer?: string;
  inStock: boolean;
  category: string;
  variations?: CreateFurnitureVariationDto[];
  images?: FurnitureImageDto[];
  imageUrl?: string;
  updateImageUrl?: boolean;
}

export class BulkUpdateStockDto {
  furnitureIds: string[];
  inStock: boolean;
}

export class PaginationQueryDto {
  page?: number = 1;
  limit?: number = 10;
  search?: string;
  category?: string;
  producer?: string;
  inStock?: boolean;
  sortBy?: 'name' | 'category' | 'producer' | 'createdAt' | 'updatedAt' = 'createdAt';
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class PaginationResponseDto<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: {
    search?: string;
    category?: string;
    producer?: string;
    inStock?: boolean;
    sortBy: string;
    sortOrder: string;
  };
}