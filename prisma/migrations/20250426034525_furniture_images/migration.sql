/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Furniture` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Furniture" DROP COLUMN "imageUrl";

-- CreateTable
CREATE TABLE "FurnitureImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "furnitureId" TEXT NOT NULL,

    CONSTRAINT "FurnitureImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FurnitureImage_furnitureId_idx" ON "FurnitureImage"("furnitureId");

-- AddForeignKey
ALTER TABLE "FurnitureImage" ADD CONSTRAINT "FurnitureImage_furnitureId_fkey" FOREIGN KEY ("furnitureId") REFERENCES "Furniture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
