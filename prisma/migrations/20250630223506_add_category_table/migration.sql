/*
  Warnings:

  - You are about to drop the column `category` on the `Furniture` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `Furniture` table without a default value. This is not possible if the table is not empty.

*/

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- Insert existing categories into the new Category table
INSERT INTO "Category" ("id", "name", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(), 
    "category", 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT "category" 
    FROM "Furniture" 
    WHERE "category" IS NOT NULL
) AS distinct_categories;

-- Add categoryId column as nullable first
ALTER TABLE "Furniture" ADD COLUMN "categoryId" TEXT;

-- Update existing furniture to reference the new categories
UPDATE "Furniture" 
SET "categoryId" = (
    SELECT "id" 
    FROM "Category" 
    WHERE "Category"."name" = "Furniture"."category"
);

-- Make categoryId NOT NULL after data migration
ALTER TABLE "Furniture" ALTER COLUMN "categoryId" SET NOT NULL;

-- Drop the old category column
ALTER TABLE "Furniture" DROP COLUMN "category";

-- CreateIndex
CREATE INDEX "Furniture_categoryId_idx" ON "Furniture"("categoryId");

-- AddForeignKey
ALTER TABLE "Furniture" ADD CONSTRAINT "Furniture_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
