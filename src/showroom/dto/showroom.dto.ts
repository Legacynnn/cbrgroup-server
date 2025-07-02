export class ShowroomImageDto {
  url: string;
  position?: number;
  title?: string;
  description?: string;
}

export class CreateShowroomImageDto {
  images: ShowroomImageDto[];
}

export class UpdateShowroomImageDto {
  url?: string;
  position?: number;
  title?: string;
  description?: string;
} 