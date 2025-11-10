-- CreateEnum
CREATE TYPE "ContactTicketStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ContactTicketHistoryAction" AS ENUM ('CREATED', 'STATUS_CHANGED', 'POSITION_CHANGED', 'ADMIN_NOTES_UPDATED', 'CUSTOMER_INFO_UPDATED');

-- CreateTable
CREATE TABLE "contact_tickets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactTicketStatus" NOT NULL DEFAULT 'NEW',
    "boardPosition" INTEGER NOT NULL DEFAULT 0,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_ticket_history" (
    "id" TEXT NOT NULL,
    "action" "ContactTicketHistoryAction" NOT NULL,
    "description" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticketId" TEXT NOT NULL,

    CONSTRAINT "contact_ticket_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_tickets_status_idx" ON "contact_tickets"("status");

-- CreateIndex
CREATE INDEX "contact_tickets_boardPosition_idx" ON "contact_tickets"("boardPosition");

-- CreateIndex
CREATE INDEX "contact_tickets_createdAt_idx" ON "contact_tickets"("createdAt");

-- CreateIndex
CREATE INDEX "contact_ticket_history_ticketId_idx" ON "contact_ticket_history"("ticketId");

-- CreateIndex
CREATE INDEX "contact_ticket_history_createdAt_idx" ON "contact_ticket_history"("createdAt");

-- AddForeignKey
ALTER TABLE "contact_ticket_history" ADD CONSTRAINT "contact_ticket_history_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "contact_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
