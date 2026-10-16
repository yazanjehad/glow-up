// Status of the ticket
export type Status = "OPEN" | "IN_PROGRESS" | "CLOSED" | "RESOLVED";

// Priority of the ticket
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// Role of the user
export type Role = "CUSTOMER" | "ADMIN" | "SUPERADMIN";

// Interface for a message in a ticket
export interface TicketMessage {
  _id: string;
  senderId: string | { _id: string; name: string };
  senderRole: Role;
  message: string;
  isInternalNote: boolean;
  time: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for a ticket
export interface Ticket {
  _id: string;
  subject: string;
  category: string;
  status: Status;
  priority: Priority;
  createdBy: string;
  createdByRole: Role;
  assignedAdmin?: string;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

//  MAPPERS: API -> FRONTEND

export function mapApiMessageToFrontend(message: any): TicketMessage {
  return {
    _id: message._id,
    senderId: typeof message.senderId === "string" ? message.senderId : message.senderId._id,
    senderRole: message.senderRole as Role,
    message: message.message,
    isInternalNote: message.isInternalNote,
    time: new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

// Map a single ticket from API to frontend shape
export function mapApiTicketToFrontend(ticket: any): Ticket {
  return {
     _id: ticket._id,
    subject: ticket.subject,
    category: ticket.category,
    status: ticket.status,
    priority: ticket.priority,
    createdBy: typeof ticket.createdBy === "string" ? ticket.createdBy : ticket.createdBy._id,
    createdByRole: ticket.createdByRole,
    assignedAdmin:
      typeof ticket.assignedAdminId === "object" && ticket.assignedAdminId !== null
        ? ticket.assignedAdminId.name || ticket.assignedAdminId._id 
        : ticket.assignedAdminId,
    messages: (ticket.messages || []).map(mapApiMessageToFrontend),
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    __v: ticket.__v,
  };
}

// Map an array of tickets from API to frontend shape
export function mapApiTicketsArray(tickets: any[]): Ticket[] {
  return tickets.map(mapApiTicketToFrontend);
}