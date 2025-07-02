/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `FurnitureVariation` table. All the data in the column will be lost.
  - Added the required column `name` to the `FurnitureVariation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `textureImageUrl` to the `FurnitureVariation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `textureType` to the `FurnitureVariation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Furniture" ADD COLUMN     "price" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "FurnitureVariation" DROP COLUMN "imageUrl",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "textureImageUrl" TEXT NOT NULL,
ADD COLUMN     "textureType" TEXT NOT NULL,
ALTER COLUMN "color" DROP NOT NULL,
ALTER COLUMN "colorCode" DROP NOT NULL;

-- CreateTable
CREATE TABLE "_VariantImages" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_VariantImages_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_VariantImages_B_index" ON "_VariantImages"("B");

-- CreateIndex
CREATE INDEX "FurnitureVariation_furnitureId_idx" ON "FurnitureVariation"("furnitureId");

-- AddForeignKey
ALTER TABLE "_VariantImages" ADD CONSTRAINT "_VariantImages_A_fkey" FOREIGN KEY ("A") REFERENCES "FurnitureImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VariantImages" ADD CONSTRAINT "_VariantImages_B_fkey" FOREIGN KEY ("B") REFERENCES "FurnitureVariation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
