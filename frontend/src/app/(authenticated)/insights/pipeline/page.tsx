"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Brain,
  ChartSpline,
  CircleHelp,
  Clock3,
  Cpu,
  Database,
  PlayCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useAnalysisPipelineHistory, useRunAnalysisPipeline } from "@/hooks/useAnalysisPipeline";
import { format } from "date-fns";

const pipelineSchema = z.object({
  lookbackDays: z.coerce.number().int().min(7).max(365),
  minCategorySharePct: z.coerce.number().min(10).max(95),
  minRecurringCount: z.coerce.number().int().min(2).max(20),
  maxSuggestions: z.coerce.number().int().min(1).max(10),
  commitInsights: z.boolean(),
});

export default function InsightsPipelinePage() {
  const [form, setForm] = useState({
    lookbackDays: "30",
    minCategorySharePct: "35",
    minRecurringCount: "3",
    maxSuggestions: "3",
    commitInsights: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const runMutation = useRunAnalysisPipeline();
  const { data: historyResponse, isLoading: isHistoryLoading } = useAnalysisPipelineHistory(10);
  const history = historyResponse?.data || [];
  const result = runMutation.data?.data;

  const hasResult = !!result;
  const weekdayRows = useMemo(() => {
    if (!result?.patterns?.weekdaySpend) return [];
    return Object.entries(result.patterns.weekdaySpend).sort((a, b) => b[1] - a[1]);
  }, [result]);

  const handleRun = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = pipelineSchema.safeParse({
      lookbackDays: Number(form.lookbackDays),
      minCategorySharePct: Number(form.minCategorySharePct),
      minRecurringCount: Number(form.minRecurringCount),
      maxSuggestions: Number(form.maxSuggestions),
      commitInsights: form.commitInsights,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "form");
        if (!nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    runMutation.mutate(parsed.data);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-5 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-sky-200/40 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Advanced Batch Intelligence
            </p>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              AI Analysis Pipeline Runner
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              This feature runs a deeper background-style financial analysis to detect category concentration,
              recurring merchant patterns, and spend timing trends. It is designed for reliable insight generation
              without slowing your normal dashboard pages.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2">
                <p className="font-semibold">Purpose</p>
                <p className="text-slate-600">Generate higher-quality recommendations from full lookback windows.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2">
                <p className="font-semibold">Why It Exists</p>
                <p className="text-slate-600">Separates heavy analytics from real-time UI requests for better UX.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2">
                <p className="font-semibold">How It Works</p>
                <p className="text-slate-600">Scan → Extract patterns → Rank suggestions → Optional commit to Insights.</p>
              </div>
            </div>
          </div>

          <Link href="/insights" className="inline-flex md:self-start">
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to Insights
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
            <Brain className="h-4 w-4 text-sky-600" />
            Stage 1
          </p>
          <h3 className="mt-1 font-semibold text-slate-900">Data Scan</h3>
          <p className="mt-1 text-sm text-slate-600">Collects transactions for your lookback period.</p>
        </Card>
        <Card className="p-4">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
            <ChartSpline className="h-4 w-4 text-cyan-600" />
            Stage 2
          </p>
          <h3 className="mt-1 font-semibold text-slate-900">Pattern Extraction</h3>
          <p className="mt-1 text-sm text-slate-600">Finds dominant categories and recurring merchants.</p>
        </Card>
        <Card className="p-4">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
            <Cpu className="h-4 w-4 text-indigo-600" />
            Stage 3
          </p>
          <h3 className="mt-1 font-semibold text-slate-900">Recommendation Ranking</h3>
          <p className="mt-1 text-sm text-slate-600">Scores and returns the strongest insights.</p>
        </Card>
        <Card className="p-4">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
            <Database className="h-4 w-4 text-emerald-600" />
            Stage 4
          </p>
          <h3 className="mt-1 font-semibold text-slate-900">Optional Commit</h3>
          <p className="mt-1 text-sm text-slate-600">Persists recommendations into your Insights feed.</p>
        </Card>
      </section>

      <Card className="p-5 sm:p-6 lg:p-7">
        <div className="mb-4 flex items-center gap-2">
          <CircleHelp className="h-4 w-4 text-sky-600" />
          <h2 className="text-lg font-semibold text-slate-900">Run Configuration</h2>
        </div>
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleRun}>
          <Input
            label="Lookback Days"
            type="number"
            min={7}
            max={365}
            value={form.lookbackDays}
            onChange={(event) => setForm((prev) => ({ ...prev, lookbackDays: event.target.value }))}
            error={errors.lookbackDays}
          />
          <Input
            label="Min Category Share %"
            type="number"
            min={10}
            max={95}
            value={form.minCategorySharePct}
            onChange={(event) => setForm((prev) => ({ ...prev, minCategorySharePct: event.target.value }))}
            error={errors.minCategorySharePct}
          />
          <Input
            label="Min Recurring Count"
            type="number"
            min={2}
            max={20}
            value={form.minRecurringCount}
            onChange={(event) => setForm((prev) => ({ ...prev, minRecurringCount: event.target.value }))}
            error={errors.minRecurringCount}
          />
          <Input
            label="Max Suggestions"
            type="number"
            min={1}
            max={10}
            value={form.maxSuggestions}
            onChange={(event) => setForm((prev) => ({ ...prev, maxSuggestions: event.target.value }))}
            error={errors.maxSuggestions}
          />

          <label className="sm:col-span-2 inline-flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2">
            <input
              type="checkbox"
              checked={form.commitInsights}
              onChange={(event) => setForm((prev) => ({ ...prev, commitInsights: event.target.checked }))}
            />
            <span className="text-sm text-gray-700">
              Persist generated recommendations into Insights (commit mode)
            </span>
          </label>

          <div className="sm:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4" />
              Dry-run is safe and does not write to your Insights table.
            </p>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              leftIcon={<PlayCircle className="h-4 w-4" />}
              isLoading={runMutation.isPending}
            >
              Run Pipeline
            </Button>
          </div>
        </form>
      </Card>

      {runMutation.isPending && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {hasResult && result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="p-4 bg-slate-50">
              <p className="text-sm text-gray-500">Transactions Scanned</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{result.stats.transactionsScanned}</p>
            </Card>
            <Card className="p-4 bg-slate-50">
              <p className="text-sm text-gray-500">Recommendations</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{result.recommendations.length}</p>
            </Card>
            <Card className="p-4 bg-slate-50">
              <p className="text-sm text-gray-500">Mode</p>
              <p className="mt-1 inline-flex items-center gap-2 text-2xl font-semibold text-gray-900">
                {result.mode === "commit" ? <BadgeCheck className="h-5 w-5 text-emerald-600" /> : null}
                {result.mode}
              </p>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="text-lg font-semibold text-gray-900">Top Recommendations</h2>
            {result.recommendations.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No recommendations generated for current thresholds.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {result.recommendations.map((entry, index) => (
                  <div key={`${entry.title}-${index}`} className="rounded-lg border border-gray-200 p-3">
                    <p className="font-medium text-gray-900">{entry.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{entry.body}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold text-gray-900">Weekday Spend Pattern</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {weekdayRows.map(([day, amount]) => (
                <div key={day} className="rounded-lg bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-500">{day}</p>
                  <p className="mt-1 font-semibold text-gray-900">{Math.round(amount)}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-brand-600" />
              <h2 className="text-lg font-semibold text-gray-900">Pipeline Summary</h2>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Normalized {result.stats.normalizedDescriptions} descriptions ({result.stats.uniqueNormalizedDescriptions} unique) and found {result.stats.categoriesFound} categories.
              {result.mode === "commit" ? ` Persisted ${result.persistedInsights} insights.` : " Dry-run mode: no rows persisted."}
            </p>
          </Card>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Clock3 className="h-4 w-4 text-sky-600" />
            Pipeline Run History
          </h2>
          <p className="mt-1 text-sm text-gray-500">Last runs with mode, status, and result summary.</p>
        </div>

        {isHistoryLoading ? (
          <div className="p-5 space-y-3">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : history.length === 0 ? (
          <div className="p-5 text-sm text-gray-500">No run history yet. Execute a pipeline run to start tracking.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Run Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Lookback</th>
                  <th className="px-4 py-3">Recommendations</th>
                  <th className="px-4 py-3">Persisted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {history.map((run) => (
                  <tr key={run.id}>
                    <td className="px-4 py-3 text-gray-700">{format(new Date(run.started_at), "MMM d, yyyy HH:mm")}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${run.status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        {run.status}
                      </span>
                      {run.error_message && <p className="mt-1 text-xs text-rose-600">{run.error_message}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{run.mode}</td>
                    <td className="px-4 py-3 text-gray-700">{run.lookback_days}d</td>
                    <td className="px-4 py-3 text-gray-700">{run.recommendations_count}</td>
                    <td className="px-4 py-3 text-gray-700">{run.persisted_insights}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
