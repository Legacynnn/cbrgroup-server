export class CreateCategoryDto {
  name: string;
  imageUrl?: string;
}

export class UpdateCategoryDto {
  name?: string;
  imageUrl?: string;
  featured?: boolean;
}

export class UpdateCategoryImageDto {
  imageUrl: string;
}

export class MergeCategoriesDto {
  primaryCategoryId: string;
  secondaryCategoryId: string;
} 