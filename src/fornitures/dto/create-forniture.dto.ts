export class FurnitureImageDto {
  url: string;
  position: number;
  variantIds?: string[];
}

export class CreateFurnitureVariationDto {
  name: string;
  textureType: string;
  color?: string;
  colorCode?: string;
  textureImageUrl: string;
  inStock: boolean;
  associatedImageIds?: string[];
}

export class CreateFurnitureDto {
  name: string;
  size: string | string[];
  description?: string;
  producer?: string;
  price?: number;
  inStock: boolean;
  categoryId: string;
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
  categoryId?: string;
  producer?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  textureType?: string;
  sortBy?: 'name' | 'category' | 'producer' | 'price' | 'createdAt' | 'updatedAt' = 'createdAt';
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
    categoryId?: string;
    producer?: string;
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
    textureType?: string;
    sortBy: string;
    sortOrder: string;
  };
}