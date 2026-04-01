"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useCreateSupportTicket, useSupportTickets } from "@/hooks/useSupportTickets";
import type { SupportTicket, SupportTicketStatus, SupportTicketType } from "@/types";
import { MessageSquareText, Star } from "lucide-react";

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

export default function SupportPage() {
  const [ticketType, setTicketType] = useState<SupportTicketType>("message");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isRefetching } = useSupportTickets();
  const createTicket = useCreateSupportTicket();

  const tickets = useMemo(() => data?.data ?? [], [data?.data]);

  const submit = async () => {
    setSubjectError(null);
    setMessageError(null);

    const normalizedSubject = subject.trim();
    const normalizedMessage = message.trim();

    if (normalizedSubject.length < 3) {
      setSubjectError("Subject must be at least 3 characters.");
      return;
    }

    if (normalizedMessage.length < 10) {
      setMessageError("Message must be at least 10 characters.");
      return;
    }

    await createTicket.mutateAsync({
      subject: normalizedSubject,
      message: normalizedMessage,
      ticket_type: ticketType,
      rating: ticketType === "review" ? rating : undefined,
    });

    setSubject("");
    setMessage("");
    setRating(5);
    setTicketType("message");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="mt-1 text-sm text-gray-600">Send a message or review and get a direct admin response.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Create Ticket" subtitle="Share your issue, feedback, or review" />

          <div className="space-y-3">
            <div className="flex gap-2" role="tablist" aria-label="Ticket type">
              <button
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  ticketType === "message" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => setTicketType("message")}
                role="tab"
                aria-selected={ticketType === "message"}
              >
                Message
              </button>
              <button
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  ticketType === "review" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => setTicketType("review")}
                role="tab"
                aria-selected={ticketType === "review"}
              >
                Review
              </button>
            </div>

            <Input
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              error={subjectError || undefined}
              maxLength={120}
              placeholder="Briefly describe your topic"
            />

            <div>
              <label htmlFor="support-message" className="mb-1.5 block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                id="support-message"
                className="min-h-[150px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                placeholder="Tell us what happened and what you expect from support"
                aria-invalid={!!messageError}
                aria-describedby={messageError ? "support-message-error" : undefined}
              />
              {messageError && (
                <p id="support-message-error" className="mt-1 text-sm text-red-600" role="alert">
                  {messageError}
                </p>
              )}
            </div>

            {ticketType === "review" && (
              <div>
                <label htmlFor="rating" className="mb-1.5 block text-sm font-medium text-gray-700">Rating</label>
                <select
                  id="rating"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>{value} star{value > 1 ? "s" : ""}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => void submit()} isLoading={createTicket.isPending}>
                Submit Ticket
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Your Tickets"
            subtitle="Track status and admin responses"
            action={
              <Button variant="outline" size="sm" onClick={() => void refetch()} isLoading={isRefetching}>
                Refresh
              </Button>
            }
          />

          <div className="space-y-3" aria-live="polite">
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading support tickets...</p>
            ) : error ? (
              <p className="text-sm text-red-600">Unable to load tickets. Try refreshing.</p>
            ) : tickets.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-500">
                No support tickets yet. Create your first message or review.
              </p>
            ) : (
              tickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TicketRow({ ticket }: { ticket: SupportTicket }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {ticket.ticket_type === "review" ? (
            <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
          ) : (
            <MessageSquareText className="h-4 w-4 text-sky-500" aria-hidden="true" />
          )}
          <h3 className="text-sm font-semibold text-gray-900">{ticket.subject}</h3>
        </div>
        <Badge variant={STATUS_VARIANT[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
      </div>

      <p className="mt-2 text-sm text-gray-700">{ticket.message}</p>
      {ticket.ticket_type === "review" && ticket.rating && (
        <p className="mt-1 text-xs font-medium text-amber-700">Rating: {ticket.rating}/5</p>
      )}

      {ticket.admin_response ? (
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-2.5">
          <p className="text-xs font-semibold text-emerald-700">Admin response</p>
          <p className="mt-1 text-sm text-emerald-900">{ticket.admin_response}</p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-gray-500">Waiting for admin response.</p>
      )}

      <p className="mt-2 text-xs text-gray-500">Submitted {new Date(ticket.created_at).toLocaleString("en-PK")}</p>
    </article>
  );
}
