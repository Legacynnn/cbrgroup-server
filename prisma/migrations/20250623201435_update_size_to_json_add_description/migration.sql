/*
  Warnings:

  - The `size` column on the `Furniture` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Furniture" DROP COLUMN "size",
ADD COLUMN     "size" JSONB;
