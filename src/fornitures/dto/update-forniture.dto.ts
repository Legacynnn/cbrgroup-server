import { PartialType } from '@nestjs/mapped-types';
import { CreateFurnitureDto, FurnitureImageDto } from './create-forniture.dto';

export class UpdateFurnitureImageDto extends FurnitureImageDto {
  id?: string;
  isDeleted?: boolean;
  // Optional array of variant IDs that this image represents
  variantIds?: string[];
}

export class UpdateFurnitureVariationDto {
  id?: string;
  name: string; // Name of the texture/variant (required for updates)
  textureType: string; // Type of texture (required for updates)
  color?: string; // Optional color description
  colorCode?: string; // Optional hex color code for UI
  textureImageUrl: string; // URL of the texture image itself (required for updates)
  inStock?: boolean;
  // Array of furniture image IDs that show this variant
  associatedImageIds?: string[];
  isDeleted?: boolean;
}

export class UpdateFurnitureDto extends PartialType(CreateFurnitureDto) {
  images?: UpdateFurnitureImageDto[];
  imageUrl?: string;
  updateImageUrl?: boolean;
}