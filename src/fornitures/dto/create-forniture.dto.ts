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
  size: string;
  inStock: boolean;
  category: string;
  variations?: CreateFurnitureVariationDto[];
  images?: FurnitureImageDto[];
  imageUrl?: string;
  updateImageUrl?: boolean;
}