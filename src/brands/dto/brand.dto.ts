export class CreateBrandDto {
  name: string
  coverUrl: string
  logoUrl?: string
  websiteUrl?: string
  description?: string
  deals: string[]
}

export class UpdateBrandDto {
  name?: string
  coverUrl?: string
  logoUrl?: string
  websiteUrl?: string
  description?: string
  deals?: string[]
}

