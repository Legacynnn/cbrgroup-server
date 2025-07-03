-- AlterTable
ALTER TABLE "Furniture" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPromotionActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promotionExpiresAt" TIMESTAMP(3),
ADD COLUMN     "promotionPrice" DECIMAL(65,30);

-- CreateIndex
CREATE INDEX "Furniture_featured_idx" ON "Furniture"("featured");

-- CreateIndex
CREATE INDEX "Furniture_isPromotionActive_idx" ON "Furniture"("isPromotionActive");

-- CreateIndex
CREATE INDEX "Furniture_promotionExpiresAt_idx" ON "Furniture"("promotionExpiresAt");
