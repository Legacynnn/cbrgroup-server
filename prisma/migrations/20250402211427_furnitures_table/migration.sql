-- CreateTable
CREATE TABLE "Furniture" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Furniture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FurnitureVariation" (
    "id" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "colorCode" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "furnitureId" TEXT NOT NULL,

    CONSTRAINT "FurnitureVariation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FurnitureVariation" ADD CONSTRAINT "FurnitureVariation_furnitureId_fkey" FOREIGN KEY ("furnitureId") REFERENCES "Furniture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
