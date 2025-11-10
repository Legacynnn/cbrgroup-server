import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { CreateContactTicketDto, UpdateContactTicketDto } from './dto'
import { ContactTicketStatus, ContactTicketHistoryAction } from '@prisma/client'

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  private async createHistoryEntry(
    ticketId: string,
    action: ContactTicketHistoryAction,
    description: string,
    oldValue?: any,
    newValue?: any,
    performedBy?: string,
    prismaInstance?: any
  ) {
    const prisma = prismaInstance || this.prisma
    return prisma.contactTicketHistory.create({
      data: {
        ticketId,
        action,
        description,
        oldValue,
        newValue,
        performedBy: performedBy || 'system'
      }
    })
  }

  async create(createContactTicketDto: CreateContactTicketDto) {
    const maxPosition = await this.prisma.contactTicket.findFirst({
      where: { status: ContactTicketStatus.NEW },
      orderBy: { boardPosition: 'desc' },
      select: { boardPosition: true }
    })

    const boardPosition = maxPosition ? maxPosition.boardPosition + 1 : 0

    return this.prisma.$transaction(async (prisma) => {
      const ticket = await prisma.contactTicket.create({
        data: {
          ...createContactTicketDto,
          boardPosition
        },
        include: {
          history: true
        }
      })

      await this.createHistoryEntry(
        ticket.id,
        ContactTicketHistoryAction.CREATED,
        `Contact ticket created by ${createContactTicketDto.name}`,
        null,
        { status: ticket.status, name: ticket.name, email: ticket.email },
        'customer',
        prisma
      )

      return this.formatTicketResponse(ticket)
    })
  }

  async findAll(includeHistory: boolean = false) {
    return this.prisma.contactTicket.findMany({
      orderBy: [
        { status: 'asc' },
        { boardPosition: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        history: includeHistory ? {
          orderBy: { createdAt: 'desc' }
        } : false
      }
    })
  }

  async findOne(id: string, includeHistory: boolean = false) {
    const ticket = await this.prisma.contactTicket.findUnique({
      where: { id },
      include: {
        history: includeHistory ? {
          orderBy: { createdAt: 'desc' }
        } : false
      }
    })

    if (!ticket) {
      throw new NotFoundException(`Contact ticket with ID ${id} not found`)
    }

    return this.formatTicketResponse(ticket)
  }

  async update(id: string, updateContactTicketDto: UpdateContactTicketDto, performedBy?: string) {
    const existingTicket = await this.prisma.contactTicket.findUnique({
      where: { id }
    })

    if (!existingTicket) {
      throw new NotFoundException(`Contact ticket with ID ${id} not found`)
    }

    const changes: string[] = []
    const oldValues: any = {}
    const newValues: any = {}

    Object.keys(updateContactTicketDto).forEach(key => {
      const oldValue = existingTicket[key]
      const newValue = updateContactTicketDto[key]
      if (oldValue !== newValue && newValue !== undefined) {
        changes.push(key)
        oldValues[key] = oldValue
        newValues[key] = newValue
      }
    })

    if (changes.length === 0) {
      return this.formatTicketResponse(existingTicket)
    }

    let newBoardPosition = existingTicket.boardPosition
    let statusChanged = false

    if (updateContactTicketDto.status && existingTicket.status !== updateContactTicketDto.status) {
      statusChanged = true
      const maxPosition = await this.prisma.contactTicket.findFirst({
        where: { status: updateContactTicketDto.status },
        orderBy: { boardPosition: 'desc' },
        select: { boardPosition: true }
      })

      newBoardPosition = maxPosition ? maxPosition.boardPosition + 1 : 0
    }

    return this.prisma.$transaction(async (prisma) => {
      const updatedTicket = await prisma.contactTicket.update({
        where: { id },
        data: {
          ...updateContactTicketDto,
          ...(statusChanged && { boardPosition: newBoardPosition })
        },
        include: {
          history: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      let historyAction: ContactTicketHistoryAction = ContactTicketHistoryAction.CUSTOMER_INFO_UPDATED
      let description = `Updated ${changes.join(', ')}`

      if (updateContactTicketDto.status && existingTicket.status !== updateContactTicketDto.status) {
        historyAction = ContactTicketHistoryAction.STATUS_CHANGED
        description = `Status changed from ${existingTicket.status} to ${updateContactTicketDto.status}`
      } else if (updateContactTicketDto.boardPosition !== undefined && existingTicket.boardPosition !== updateContactTicketDto.boardPosition) {
        historyAction = ContactTicketHistoryAction.POSITION_CHANGED
        description = `Position changed to ${updateContactTicketDto.boardPosition}`
      } else if (updateContactTicketDto.adminNotes !== undefined && existingTicket.adminNotes !== updateContactTicketDto.adminNotes) {
        historyAction = ContactTicketHistoryAction.ADMIN_NOTES_UPDATED
        description = 'Admin notes updated'
      }

      await this.createHistoryEntry(
        id,
        historyAction,
        description,
        oldValues,
        newValues,
        performedBy || 'admin',
        prisma
      )

      return this.formatTicketResponse(updatedTicket)
    })
  }

  async updateBoardPosition(id: string, status: ContactTicketStatus, boardPosition: number, performedBy?: string) {
    const ticket = await this.prisma.contactTicket.findUnique({
      where: { id }
    })

    if (!ticket) {
      throw new NotFoundException(`Contact ticket with ID ${id} not found`)
    }

    return this.prisma.$transaction(async (prisma) => {
      if (ticket.status !== status) {
        const ticketsInNewStatus = await prisma.contactTicket.findMany({
          where: { status },
          orderBy: { boardPosition: 'asc' }
        })

        for (let i = boardPosition; i < ticketsInNewStatus.length; i++) {
          await prisma.contactTicket.update({
            where: { id: ticketsInNewStatus[i].id },
            data: { boardPosition: i + 1 }
          })
        }

        const ticketsInOldStatus = await prisma.contactTicket.findMany({
          where: { 
            status: ticket.status,
            boardPosition: { gt: ticket.boardPosition }
          },
          orderBy: { boardPosition: 'asc' }
        })

        for (let i = 0; i < ticketsInOldStatus.length; i++) {
          await prisma.contactTicket.update({
            where: { id: ticketsInOldStatus[i].id },
            data: { boardPosition: ticket.boardPosition + i }
          })
        }
      } else {
        const ticketsInSameStatus = await prisma.contactTicket.findMany({
          where: { 
            status,
            id: { not: id }
          },
          orderBy: { boardPosition: 'asc' }
        })

        const oldPosition = ticket.boardPosition
        const newPosition = boardPosition

        if (newPosition > oldPosition) {
          for (const t of ticketsInSameStatus) {
            if (t.boardPosition > oldPosition && t.boardPosition <= newPosition) {
              await prisma.contactTicket.update({
                where: { id: t.id },
                data: { boardPosition: t.boardPosition - 1 }
              })
            }
          }
        } else if (newPosition < oldPosition) {
          for (const t of ticketsInSameStatus) {
            if (t.boardPosition >= newPosition && t.boardPosition < oldPosition) {
              await prisma.contactTicket.update({
                where: { id: t.id },
                data: { boardPosition: t.boardPosition + 1 }
              })
            }
          }
        }
      }

      const updatedTicket = await prisma.contactTicket.update({
        where: { id },
        data: {
          status,
          boardPosition
        },
        include: {
          history: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      await this.createHistoryEntry(
        id,
        ContactTicketHistoryAction.POSITION_CHANGED,
        `Moved to position ${boardPosition} in ${status} column`,
        {
          oldStatus: ticket.status,
          oldPosition: ticket.boardPosition
        },
        {
          newStatus: status,
          newPosition: boardPosition
        },
        performedBy || 'admin',
        prisma
      )

      return this.formatTicketResponse(updatedTicket)
    })
  }

  async getTicketsByStatus() {
    const tickets = await this.prisma.contactTicket.findMany({
      include: {
        history: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: [
        { status: 'asc' },
        { boardPosition: 'asc' }
      ]
    })

    const ticketsByStatus: Record<string, any[]> = {}

    Object.values(ContactTicketStatus).forEach(status => {
      ticketsByStatus[status] = tickets
        .filter(ticket => ticket.status === status)
        .map(ticket => this.formatTicketResponse(ticket))
    })

    return ticketsByStatus
  }

  async getTicketStats() {
    const stats = await this.prisma.contactTicket.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    const totalTickets = await this.prisma.contactTicket.count()
    const recentTickets = await this.prisma.contactTicket.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })

    return {
      total: totalTickets,
      recent: recentTickets,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id
        return acc
      }, {} as Record<string, number>)
    }
  }

  private formatTicketResponse(ticket: any) {
    return {
      id: ticket.id,
      name: ticket.name,
      email: ticket.email,
      phone: ticket.phone,
      message: ticket.message,
      status: ticket.status,
      boardPosition: ticket.boardPosition,
      adminNotes: ticket.adminNotes,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      history: ticket.history?.map((h: any) => ({
        id: h.id,
        action: h.action,
        description: h.description,
        oldValue: h.oldValue,
        newValue: h.newValue,
        performedBy: h.performedBy,
        timestamp: h.createdAt
      }))
    }
  }
}

