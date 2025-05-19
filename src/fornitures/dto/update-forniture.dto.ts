import { PartialType } from '@nestjs/mapped-types';
import { CreateFurnitureDto, FurnitureImageDto } from './create-forniture.dto';

export class UpdateFurnitureImageDto extends FurnitureImageDto {
  id?: string;
  isDeleted?: boolean;
}

export class UpdateFurnitureDto extends PartialType(CreateFurnitureDto) {
  images?: UpdateFurnitureImageDto[];
  imageUrl?: string;
  updateImageUrl?: boolean;
}