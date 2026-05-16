import { getAdminClient } from "@config/supabaseAdminClient";
import { HttpError } from "@utils/error";
import { createAlert } from "@modules/alerts/alerts.service";

export type SupportTicketType = "message" | "review";
export type SupportTicketStatus = "open" | "in_review" | "resolved" | "closed";

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  ticket_type: SupportTicketType;
  rating: number | null;
  status: SupportTicketStatus;
  admin_response: string | null;
  admin_response_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSupportTicket extends SupportTicket {
  user_email: string;
  user_full_name: string;
}

interface CreateSupportTicketInput {
  subject: string;
  message: string;
  ticket_type: SupportTicketType;
  rating?: number;
}

interface ListSupportTicketsFilters {
  limit?: number;
  status?: SupportTicketStatus;
}

interface ReplySupportTicketInput {
  status: SupportTicketStatus;
  admin_response: string;
}

function mapSupportTicket(row: Record<string, unknown>): SupportTicket {
  return {
    id: String(row.id || ""),
    user_id: String(row.user_id || ""),
    subject: String(row.subject || ""),
    message: String(row.message || ""),
    ticket_type: (row.ticket_type as SupportTicketType) || "message",
    rating: typeof row.rating === "number" ? row.rating : null,
    status: (row.status as SupportTicketStatus) || "open",
    admin_response: row.admin_response ? String(row.admin_response) : null,
    admin_response_at: row.admin_response_at ? String(row.admin_response_at) : null,
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
  };
}

export async function createSupportTicket(
  userId: string,
  input: CreateSupportTicketInput
): Promise<SupportTicket> {
  const supabase = getAdminClient();
  const payload = {
    user_id: userId,
    subject: input.subject,
    message: input.message,
    ticket_type: input.ticket_type,
    rating: input.ticket_type === "review" ? input.rating || null : null,
    status: "open",
  };

  const { data, error } = await supabase
    .from("support_tickets")
    .insert(payload)
    .select("id, user_id, subject, message, ticket_type, rating, status, admin_response, admin_response_at, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new HttpError(500, "Unable to create support ticket");
  }

  const ticket = mapSupportTicket(data as Record<string, unknown>);

  // Notify admins when a new support ticket is created so platform admins receive system alerts
  (async () => {
    try {
      const subject = String(ticket.subject || "New support ticket");
      const userId = String(ticket.user_id || "");
      const msg = `A new support ticket ('${subject}') was created by user ${userId}.`;
      await createAlert({
        // system alert - no user_id, visible to admins via is_system filter
        is_system: true,
        title: "New support ticket",
        message: msg,
        severity: "info",
      });
    } catch (e) {
      // don't block ticket creation on notification failure
    }
  })();

  return ticket;
}

export async function listSupportTicketsForUser(
  userId: string,
  filters: ListSupportTicketsFilters = {}
): Promise<SupportTicket[]> {
  const supabase = getAdminClient();
  const safeLimit = Math.min(Math.max(filters.limit || 50, 1), 100);
  let query = supabase
    .from("support_tickets")
    .select("id, user_id, subject, message, ticket_type, rating, status, admin_response, admin_response_at, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(500, "Unable to load support tickets");
  }

  return (data || []).map((row) => mapSupportTicket(row as Record<string, unknown>));
}

export async function listSupportTicketsForAdmin(
  filters: ListSupportTicketsFilters = {}
): Promise<AdminSupportTicket[]> {
  const supabase = getAdminClient();
  const safeLimit = Math.min(Math.max(filters.limit || 100, 1), 200);
  let query = supabase
    .from("support_tickets")
    .select("id, user_id, subject, message, ticket_type, rating, status, admin_response, admin_response_at, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(500, "Unable to load support tickets");
  }

  const tickets = (data || []).map((row) => mapSupportTicket(row as Record<string, unknown>));
  const userIds = Array.from(new Set(tickets.map((ticket) => ticket.user_id).filter(Boolean)));

  const userMap = new Map<string, { email: string; full_name: string }>();
  if (userIds.length) {
    const { data: users } = await supabase
      .from("users")
      .select("id, email, full_name")
      .in("id", userIds);

    for (const row of users || []) {
      userMap.set(String(row.id || ""), {
        email: String(row.email || ""),
        full_name: String(row.full_name || ""),
      });
    }
  }

  return tickets.map((ticket) => {
    const profile = userMap.get(ticket.user_id);
    return {
      ...ticket,
      user_email: profile?.email || "Unknown",
      user_full_name: profile?.full_name || "",
    };
  });
}

export async function replyToSupportTicket(
  ticketId: string,
  input: ReplySupportTicketInput
): Promise<AdminSupportTicket> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .update({
      status: input.status,
      admin_response: input.admin_response,
      admin_response_at: new Date().toISOString(),
    })
    .eq("id", ticketId)
    .select("id, user_id, subject, message, ticket_type, rating, status, admin_response, admin_response_at, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new HttpError(404, "Support ticket not found");
  }

  const ticket = mapSupportTicket(data as Record<string, unknown>);
  const { data: userRow } = await supabase
    .from("users")
    .select("email, full_name")
    .eq("id", ticket.user_id)
    .maybeSingle();

  await createAlert({
    user_id: ticket.user_id,
    title: "Support response received",
    message: `Your support request '${ticket.subject}' has a new response from admin.`,
    severity: "info",
  }).catch(() => null);

  return {
    ...ticket,
    user_email: String(userRow?.email || "Unknown"),
    user_full_name: String(userRow?.full_name || ""),
  };
}
