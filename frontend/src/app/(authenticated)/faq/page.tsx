"use client";

import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/utils/constants";

const FAQ_ITEMS = [
  {
    q: "How quickly do transactions appear in analytics?",
    a: "Transactions are reflected almost immediately. If your network is unstable, the page may show cached data briefly and then refresh with the latest values.",
  },
  {
    q: "How do recurring transactions work?",
    a: "When recurring is enabled on a transaction, the backend schedules the next recurrence and creates due records automatically during periodic processing.",
  },
  {
    q: "Why am I seeing no insights?",
    a: "Insights improve after enough transaction history is available. Add a few categorized transactions and try regenerate on the AI Hub page.",
  },
  {
    q: "How can I contact support?",
    a: "Open Support and submit a message or review ticket. Admin replies will appear on your ticket timeline and notifications page.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Requests are authenticated and user data access is scoped by policies and role checks on backend APIs.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">FAQ</h1>
        <p className="mt-1 text-sm text-gray-600">Frequently asked questions for buyers and sellers.</p>
      </div>

      <Card>
        <CardHeader title="Common Questions" subtitle="Quick answers to the most important product and support topics" />
        <div className="space-y-3" role="list" aria-label="Frequently asked questions">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="rounded-lg border border-gray-200 bg-gray-50 p-3" role="listitem">
              <summary className="cursor-pointer text-sm font-semibold text-gray-900">{item.q}</summary>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </Card>

      <Card className="bg-blue-50/60 border-blue-100">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Need personalized help?</h2>
            <p className="text-sm text-gray-600">Reach support directly or chat with the live assistant.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={ROUTES.SUPPORT_TICKETS}><Button variant="outline">Open Support</Button></Link>
            <Link href={ROUTES.LIVE_CHATBOT}><Button>Live Chatbot</Button></Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
