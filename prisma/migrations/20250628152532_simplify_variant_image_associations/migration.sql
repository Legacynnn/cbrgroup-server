/*
  Warnings:

  - You are about to drop the `_VariantImages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_VariantImages" DROP CONSTRAINT "_VariantImages_A_fkey";

-- DropForeignKey
ALTER TABLE "_VariantImages" DROP CONSTRAINT "_VariantImages_B_fkey";

-- AlterTable
ALTER TABLE "FurnitureVariation" ADD COLUMN     "associatedImageIds" JSONB;

-- DropTable
DROP TABLE "_VariantImages";
