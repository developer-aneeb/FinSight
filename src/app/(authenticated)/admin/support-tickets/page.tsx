"use client";

import { useMemo, useState } from "react";
import { AdminSubnav } from "@/components/admin/AdminSubnav";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAdminSupportTickets, useReplySupportTicket } from "@/hooks/useSupportTickets";
import type { AdminSupportTicket, SupportTicketStatus } from "@/types";
import { MessageSquareText, ShieldCheck, Star } from "lucide-react";

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: "Open",
  in_review: "In Review",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUS_VARIANT: Record<SupportTicketStatus, "default" | "warning" | "success" | "secondary"> = {
  open: "default",
  in_review: "warning",
  resolved: "success",
  closed: "secondary",
};

const STATUS_OPTIONS: SupportTicketStatus[] = ["open", "in_review", "resolved", "closed"];

export default function AdminSupportTicketsPage() {
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | "all">("all");

  const { data, isLoading, error, refetch, isRefetching } = useAdminSupportTickets(
    statusFilter === "all" ? undefined : statusFilter
  );

  const tickets = useMemo(() => data?.data ?? [], [data?.data]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <ShieldCheck size={24} className="text-brand-600" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Support Tickets</h1>
        </div>
        <AdminSubnav />
      </div>

      <Card>
        <CardHeader
          title="Ticket Queue"
          subtitle="Review user messages and send responses"
          action={
            <div className="flex items-center gap-2">
              <select
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SupportTicketStatus | "all")}
                aria-label="Filter tickets by status"
              >
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={() => void refetch()} isLoading={isRefetching}>
                Refresh
              </Button>
            </div>
          }
        />

        <div className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading support queue...</p>
          ) : error ? (
            <p className="text-sm text-red-600">Unable to load support queue.</p>
          ) : tickets.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-500">No tickets found for current filter.</p>
          ) : (
            tickets.map((ticket) => <AdminTicketRow key={ticket.id} ticket={ticket} />)
          )}
        </div>
      </Card>
    </div>
  );
}

function AdminTicketRow({ ticket }: { ticket: AdminSupportTicket }) {
  const [responseText, setResponseText] = useState(ticket.admin_response || "");
  const [status, setStatus] = useState<SupportTicketStatus>(ticket.status);
  const replyMutation = useReplySupportTicket();

  return (
    <article className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            {ticket.ticket_type === "review" ? (
              <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
            ) : (
              <MessageSquareText className="h-4 w-4 text-sky-500" aria-hidden="true" />
            )}
            <p className="text-sm font-semibold text-gray-900">{ticket.subject}</p>
          </div>
          <p className="mt-1 text-xs text-gray-600">
            {ticket.user_full_name || "Unknown user"} • {ticket.user_email} • {new Date(ticket.created_at).toLocaleString("en-PK")}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
      </div>

      <p className="mt-2 text-sm text-gray-700">{ticket.message}</p>
      {ticket.ticket_type === "review" && ticket.rating && (
        <p className="mt-1 text-xs font-medium text-amber-700">Rating: {ticket.rating}/5</p>
      )}

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[180px_1fr_auto] sm:items-start">
        <select
          className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as SupportTicketStatus)}
          aria-label="Set support ticket status"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>{STATUS_LABELS[option]}</option>
          ))}
        </select>

        <textarea
          className="min-h-[84px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          placeholder="Write an admin response"
          maxLength={2000}
          aria-label="Admin response"
        />

        <Button
          className="sm:self-end"
          isLoading={replyMutation.isPending}
          onClick={() =>
            replyMutation.mutate({
              id: ticket.id,
              status,
              admin_response: responseText.trim(),
            })
          }
          disabled={responseText.trim().length < 5}
        >
          Save Reply
        </Button>
      </div>
    </article>
  );
}
