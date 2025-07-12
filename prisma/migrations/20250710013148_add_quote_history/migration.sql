-- CreateEnum
CREATE TYPE "QuoteHistoryAction" AS ENUM ('CREATED', 'STATUS_CHANGED', 'POSITION_CHANGED', 'ADMIN_NOTES_UPDATED', 'CUSTOMER_INFO_UPDATED', 'ITEMS_UPDATED');

-- CreateTable
CREATE TABLE "QuoteHistory" (
    "id" TEXT NOT NULL,
    "action" "QuoteHistoryAction" NOT NULL,
    "description" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quoteId" TEXT NOT NULL,

    CONSTRAINT "QuoteHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteHistory_quoteId_idx" ON "QuoteHistory"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteHistory_createdAt_idx" ON "QuoteHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "QuoteHistory" ADD CONSTRAINT "QuoteHistory_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
