import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ticket, TicketDocument, TicketMessage } from './schemas/ticket.schema';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddTicketMessageDto } from './dto/add.ticketMessage.dto';
import { UpdateTicketStatus_PriorityDto } from './dto/update.ticketStatus.dto';
import { TicketStatus, TicketUserRole } from './schemas/ticket.schema';
import { RoleType } from 'src/common/enum/roletype.enum';

@Injectable()
export class TicketService {
  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
  ) {}

  /* ================= Create Ticket ================= */
  async createTicket(
    userId: string,
    role: string,
    dto: CreateTicketDto,
  ) {
    const session = await this.ticketModel.db.startSession();
    session.startTransaction();
    try {
      const userRole = Array.isArray(role) ? role[0] : role;

      const ticket = new this.ticketModel({
        createdBy: new Types.ObjectId(userId),
        createdByRole: userRole,
        category: dto.category,
        subject: dto.subject,
        status: TicketStatus.OPEN,
        messages: dto.message ? [{
          senderId: new Types.ObjectId(userId),
          senderRole: userRole,
          message: dto.message,
          isInternalNote: false,
        },
      ]
      : [],
      });
    //populate createdBy and assignedAdminId and senderId (name)
      const savedTicket = await ticket.save({ session });

      await savedTicket.populate([
        { path: 'createdBy', select: 'name' },
        { path: 'assignedAdminId', select: 'name' },
        { path: 'messages.senderId', select: 'name' },
      ]);

      await session.commitTransaction();
      session.endSession();

      return savedTicket;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /* ================= Get Tickets By Creator ================= */
 async getTicketsByCreator(
  userId: string,
  role: TicketUserRole,
  query: { status?: string; category?: string },
) {

  const userRole = Array.isArray(role) ? role[0] : role;

  const filter: any = {
    createdBy: new Types.ObjectId(userId),
    createdByRole: userRole,
  };

  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;

  const tickets = await this.ticketModel
    .find(filter)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email')
    .populate('assignedAdminId', 'name email')
    .populate('messages.senderId', 'name email')
    .lean();

  return tickets.map(ticket => ({
    ...ticket,
    messages: (ticket.messages || []).filter(
      msg => userRole === TicketUserRole.ADMIN || !msg.isInternalNote
    ),
  }));
}


  /* ================= Get Ticket Details ================= */
async getTicketDetails(
  ticketId: string,
  userId: string,
  role: TicketUserRole,
) {

  const ticket = await this.ticketModel
    .findById(ticketId)
    .populate('createdBy', 'name email')
    .populate('assignedAdminId', 'name email')
    .populate('messages.senderId', 'name email');
    

  if (!ticket) throw new NotFoundException('common.errors.TICKET_NOT_FOUND');

  const isCreator = ticket.createdBy._id.toString() === userId;

  const isAssignedAdmin =
    ticket.assignedAdminId &&
    ticket.assignedAdminId._id.toString() === userId;

  const isSuperAdmin = role === TicketUserRole.SUPER_ADMIN;

  if (!isCreator && !isAssignedAdmin && !isSuperAdmin) {
    throw new ForbiddenException('common.errors.ACCESS_DENIED');
  }

  // Hide internal notes if not admin
  let messages = ticket.messages;

  if (
    role !== TicketUserRole.ADMIN &&
    role !== TicketUserRole.SUPER_ADMIN
  ) {
  // if message is empty array or undefined return empty array
    if (!messages || messages.length === 0) {
      messages = [];
    } else {
    messages = messages.filter((m) => !m.isInternalNote);
  }
  }

  return {
    messages


  };
}

  

  /* ================= Add Message ================= */
 async addMessage(
  ticketId: string,
  userId: string,
  role: string,
  dto: AddTicketMessageDto,
) {
  const session = await this.ticketModel.db.startSession();
  session.startTransaction();
  try {
    const userRole = Array.isArray(role) ? role[0] : role;

    const ticket = await this.ticketModel.findById(ticketId).session(session);
    if (!ticket) throw new NotFoundException('common.errors.TICKET_NOT_FOUND');



    const isCreator = ticket.createdBy.toString() === userId;

  const isAssignedAdmin =
    ticket.assignedAdminId &&
    ticket.assignedAdminId.toString() === userId;

    const isSuperAdmin = userRole === TicketUserRole.SUPER_ADMIN;

    if (!isCreator && !isAssignedAdmin && !isSuperAdmin) {
      throw new ForbiddenException('common.errors.ACCESS_DENIED');
    }

    /* ===== Internal Note Permission ===== */

    if (
      dto.isInternalNote &&
      ![TicketUserRole.ADMIN, TicketUserRole.SUPER_ADMIN].includes(userRole as any)) {
      throw new ForbiddenException('common.errors.INTERNAL_NOTES_ADMIN_ONLY');
    }
    
  /* ===== Push Message ===== */

    ticket.messages?.push({
      senderId: new Types.ObjectId(userId),
      senderRole: userRole,
      message: dto.message,
      isInternalNote: dto.isInternalNote ?? false,
    });

    await ticket.save({ session });
    await session.commitTransaction();
    session.endSession();

    return ticket;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}


  /* ================= Get All Tickets (Admin , super Admin) ================= */
async getAllTickets(
  userId: string,
  role: string,
  query: { status?: string; category?: string; createdByRole?: string , priority?: string},
) {
  const userRole = Array.isArray(role) ? role[0] : role;

  const filter: any = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.createdByRole) filter.createdByRole = query.createdByRole;
  if (query.priority) filter.priority = query.priority;

  /* ===== Super Admin ===== */
  if (userRole === TicketUserRole.SUPER_ADMIN) {
    return this.ticketModel
      .find(filter)
      .populate('createdBy', 'name ')
      .populate('assignedAdminId', 'name ')
      .populate('messages.senderId', 'name ')
      .sort({ createdAt: -1 });
  }

  /* ===== Admin ===== */
  if (userRole === TicketUserRole.ADMIN) {
    filter.assignedAdminId = new Types.ObjectId(userId);

    return this.ticketModel
      .find(filter)
      .populate('createdBy', 'name ')
      .populate('assignedAdminId', 'name ')
      .populate('messages.senderId', 'name ')
      .sort({ createdAt: -1 });
  }

  throw new ForbiddenException('common.errors.NOT_ALLOWED');
}


  /* ================= Assign Ticket ================= */
async assignTicket(
  ticketId: string,
  adminId: string | undefined,
  superAdminId: string,
  role: string
) {
  // 1. التأكد من الصلاحية
  if (role !== RoleType.SUPER_ADMIN) {
    throw new ForbiddenException('common.errors.ONLY_SUPER_ADMIN_CAN_ASSIGN_TICKETS');
  }

 
  const ticket = await this.ticketModel.findById(ticketId)
    .populate('createdBy', 'name ')
   .populate('assignedAdminId', 'name ')
    .populate('messages.senderId', 'name ');

  if (!ticket) throw new NotFoundException('common.errors.TICKET_NOT_FOUND');

  
  if (adminId) {
    ticket.assignedAdminId = new Types.ObjectId(adminId); // assign / change admin
    ticket.status = TicketStatus.IN_PROGRESS;
  } else {
    ticket.assignedAdminId = undefined; // unassign
    ticket.status = TicketStatus.OPEN;
  }

  // 4. حفظ التعديلات
  return ticket.save();
}



  /* ================= Update Ticket Status or priority ================= */
  async updateTicketStatus(
  ticketId: string,
  userId: string,
  role: string,
  dto: UpdateTicketStatus_PriorityDto,
) {
  const userRole = Array.isArray(role) ? role[0] : role;

  const ticket = await this.ticketModel.findById(ticketId);
  if (!ticket) throw new NotFoundException('common.errors.TICKET_NOT_FOUND');

  /* ===== Prevent update if closed ===== */
  if (ticket.status === TicketStatus.CLOSED) {
    throw new BadRequestException('common.errors.TICKET_CANNOT_UPDATE_CLOSED');
  }

  /* =====================================================
     SUPER ADMIN FLOW
  ===================================================== */
  if (userRole === TicketUserRole.SUPER_ADMIN) {

    if (dto.status) ticket.status = dto.status;
    if (dto.priority) ticket.priority = dto.priority;

    return ticket.save();
  }

  /* =====================================================
     ADMIN FLOW
  ===================================================== */
  if (userRole === TicketUserRole.ADMIN) {

    if (ticket.assignedAdminId?.toString() !== userId) {
      throw new ForbiddenException('common.errors.NOT_ASSIGNED_TO_THIS_TICKET');
    }

    if (dto.priority) {
      throw new ForbiddenException('common.errors.ADMIN_CANNOT_CHANGE_PRIORITY');
    }

    if (dto.status) ticket.status = dto.status;

    return ticket.save();
  }

  throw new ForbiddenException('common.errors.NOT_ALLOWED');
}

}
