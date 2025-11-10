import { ContactTicketStatus } from '@prisma/client'

export class UpdateContactTicketDto {
  status?: ContactTicketStatus
  boardPosition?: number
  adminNotes?: string
  name?: string
  email?: string
  phone?: string
  message?: string
}

