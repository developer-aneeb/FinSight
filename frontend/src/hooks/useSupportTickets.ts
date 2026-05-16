"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "@/hooks/apiClient";
import type {
  AdminSupportTicket,
  ApiResponse,
  SupportTicket,
  SupportTicketStatus,
  SupportTicketType,
} from "@/types";
import toast from "react-hot-toast";

const USER_TICKETS_KEY = ["support", "tickets"] as const;
const ADMIN_TICKETS_KEY = ["admin", "support", "tickets"] as const;

export function useSupportTickets(status?: SupportTicketStatus) {
  return useQuery<ApiResponse<SupportTicket[]>>({
    queryKey: [...USER_TICKETS_KEY, status || "all"],
    queryFn: () => apiGet("/support/tickets", { limit: 100, status }),
    staleTime: 15_000,
  });
}

export function useCreateSupportTicket() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      subject: string;
      message: string;
      ticket_type: SupportTicketType;
      rating?: number;
    }) => apiPost<SupportTicket>("/support/tickets", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USER_TICKETS_KEY });
      qc.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Support ticket sent successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to send support ticket"),
  });
}

export function useAdminSupportTickets(status?: SupportTicketStatus) {
  return useQuery<ApiResponse<AdminSupportTicket[]>>({
    queryKey: [...ADMIN_TICKETS_KEY, status || "all"],
    queryFn: () => apiGet("/admin/support/tickets", { limit: 200, status }),
    staleTime: 10_000,
  });
}

export function useReplySupportTicket() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: { id: string; status: SupportTicketStatus; admin_response: string }) =>
      apiPatch<AdminSupportTicket>(`/admin/support/tickets/${payload.id}`, {
        status: payload.status,
        admin_response: payload.admin_response,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_TICKETS_KEY });
      qc.invalidateQueries({ queryKey: USER_TICKETS_KEY });
      toast.success("Support ticket updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update support ticket"),
  });
}
