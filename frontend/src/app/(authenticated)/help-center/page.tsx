"use client";

import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/utils/constants";

const HELP_SECTIONS = [
  {
    title: "Account & Access",
    points: [
      "Reset password from Settings or forgot-password flow.",
      "Keep profile details updated for accurate notifications.",
      "Admins can manage users from Admin > Users.",
    ],
  },
  {
    title: "Transactions & Budgets",
    points: [
      "Use the latest transaction date defaults to today for quick entry.",
      "Enable recurring transactions for periodic expenses/income.",
      "Create category budgets and monitor alerts for threshold breaches.",
    ],
  },
  {
    title: "Insights & Analytics",
    points: [
      "Dashboard and analytics auto-refresh with latest available data.",
      "Use AI Hub for generated recommendations.",
      "If charts look empty, check transaction volume and selected period.",
    ],
  },
  {
    title: "Support & Escalation",
    points: [
      "Use Support page to send a message or product/service review.",
      "Admins respond directly in ticket threads.",
      "You receive a notification when an admin reply is posted.",
    ],
  },
];

export default function HelpCenterPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
        <p className="mt-1 text-sm text-gray-600">Guides for product usage, troubleshooting, and support workflows.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {HELP_SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader title={section.title} />
            <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700" aria-label={section.title}>
              {section.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className="border-emerald-100 bg-emerald-50/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Still stuck?</h2>
            <p className="text-sm text-gray-600">Start a support ticket and get a direct admin response.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={ROUTES.FAQ}><Button variant="outline">Read FAQ</Button></Link>
            <Link href={ROUTES.SUPPORT_TICKETS}><Button>Create Ticket</Button></Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
