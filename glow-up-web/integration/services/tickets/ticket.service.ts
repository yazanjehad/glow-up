import { get, patch, post } from "@/integration/http/http.client";
import {
  Ticket,
  mapApiTicketToFrontend,
  mapApiTicketsArray,
} from "./ticket.types";

/**
 * Fetch my tickets (for Customer)
 */
export async function fetchMyTickets(): Promise<Ticket[]> {
  const response = await get<any[]>("/tickets/my");
  return mapApiTicketsArray(response.data);
}

/**
 * Fetch a single ticket by ID
 */
export async function fetchTicketById(ticketId: string): Promise<Ticket> {
  const response = await get<{ ticket: any; messages: any[] }>(
    `/tickets/${ticketId}`,
  );
  return mapApiTicketToFrontend({
    ...response.data.ticket,
    messages: response.data.messages,
  });
}

/**
 * Fetch all tickets (Admin feature)
 */
export async function fetchAllTickets(filters?: {
  status?: string;
  category?: string;
  createdByRole?: string;
  priority?: string;
}): Promise<Ticket[]> {
  const query = new URLSearchParams();

  if (filters?.status) query.set("status", filters.status);
  if (filters?.category) query.set("category", filters.category);
  if (filters?.createdByRole) query.set("createdByRole", filters.createdByRole);
  if (filters?.priority) query.set("priority", filters.priority);

  const qs = query.toString();
  const url = qs ? `/tickets?${qs}` : "/tickets";

  const response = await get<any[]>(url);
  return mapApiTicketsArray(response.data);
}

/**
 * Add a message to a ticket (reply or internal note)
 */
export async function addTicketMessage(
  ticketId: string,
  message: string,
  isInternalNote = false,
): Promise<Ticket> {
  const response = await post<any>(`/tickets/${ticketId}/messages`, {
    message,
    isInternalNote,
  });

  return mapApiTicketToFrontend(response.data);
}

/**
 * Update ticket status / priority
 */
export async function updateTicketStatus(
  ticketId: string,
  status: "OPEN" | "IN_PROGRESS" | "CLOSED" | "RESOLVED",
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT",
) {
  const query = new URLSearchParams({ status });
  if (priority) query.append("priority", priority);

  const response = await patch(
    `/tickets/${ticketId}/status?${query.toString()}`,
    {},
  );

  return mapApiTicketToFrontend(response.data);
}

/**
 * Assign ticket to a specific Admin
 */
export async function assignTicketToAdmin(
  ticketId: string,
  adminId: string |null,
): Promise<Ticket> {
  const url = `/tickets/${ticketId}/assign?adminId=${adminId}`;

  const response = await patch(url, {});

  return mapApiTicketToFrontend(response.data);
}
