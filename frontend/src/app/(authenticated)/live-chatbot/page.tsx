"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Bot, SendHorizonal, Sparkles, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { apiPost, ApiError } from "@/hooks/apiClient";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

interface ChatResponse {
  reply: string;
}

function createMessage(role: ChatRole, content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

const starter = createMessage(
  "assistant",
  "Hi, I am your FinSight Live Chatbot. Ask me about budgeting, spending patterns, savings, or reducing expenses."
);

export default function LiveChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([starter]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const sendDisabled = useMemo(() => isSending || input.trim().length === 0, [isSending, input]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || isSending) return;

    setError(null);
    setInput("");

    const nextUserMessage = createMessage("user", prompt);
    const nextMessages = [...messages, nextUserMessage];
    setMessages(nextMessages);
    setIsSending(true);

    try {
      const response = await apiPost<ChatResponse>("/insights/chat", {
        message: prompt,
        history: nextMessages
          .slice(-12)
          .map((entry) => ({ role: entry.role, content: entry.content })),
      });

      const reply = response?.data?.reply?.trim() || "I could not generate a reply right now.";
      setMessages((current) => [...current, createMessage("assistant", reply)]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to send message. Please try again.";
      setError(message);
      setMessages((current) => [
        ...current,
        createMessage(
          "assistant",
          "I could not process that right now. Please retry in a few seconds."
        ),
      ]);
    } finally {
      setIsSending(false);
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      }, 0);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pb-6 sm:gap-6">
      <header className="rounded-2xl border border-sky-200/70 bg-gradient-to-r from-sky-100/70 via-white to-emerald-100/60 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-1 rounded-xl bg-white/90 p-2 text-sky-700 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Live Chatbot</h1>
            <p className="mt-1 text-sm text-slate-600">
              Real-time finance assistant for budgeting, spending optimization, and savings guidance.
            </p>
          </div>
        </div>
      </header>

      <Card className="flex min-h-[70vh] flex-col overflow-hidden border-slate-200/80 p-0">
        <div
          ref={listRef}
          className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.18),transparent_40%),radial-gradient(circle_at_bottom,_rgba(52,211,153,0.12),transparent_35%)] p-4 sm:p-6"
          aria-live="polite"
          aria-label="Live chatbot conversation"
        >
          {messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <div
                key={message.id}
                className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex max-w-[90%] items-start gap-2 rounded-2xl border px-3 py-2 text-sm shadow-sm sm:max-w-[75%] ${
                    isUser
                      ? "border-sky-200 bg-sky-600 text-white"
                      : "border-white/60 bg-white/90 text-slate-800"
                  }`}
                >
                  <span className="mt-0.5">
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </span>
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-3 py-2 text-sm text-slate-600">
                <Bot className="h-4 w-4" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-slate-200/80 bg-white p-3 sm:p-4">
          <label htmlFor="chat-input" className="sr-only">
            Ask the live chatbot
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <textarea
              id="chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about savings goals, category budgets, recurring expenses..."
              className="min-h-[96px] w-full resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
              maxLength={1000}
            />
            <Button type="submit" disabled={sendDisabled} className="sm:h-[42px] sm:min-w-[120px]">
              <SendHorizonal className="mr-2 h-4 w-4" />
              Send
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{input.length}/1000</span>
            {error ? <span className="text-rose-600">{error}</span> : <span>Responses are finance-focused.</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}
