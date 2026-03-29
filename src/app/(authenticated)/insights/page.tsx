"use client";

import React from "react";
import { format } from "date-fns";
import {
  Sparkles,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  RefreshCw,
  X,
  CreditCard,
  PieChart,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useInsights, useGenerateInsights, useDismissInsight } from "@/hooks/useInsights";
import type { Insight } from "@/types";

const getInsightIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "saving_opportunity":
      return <TrendingDown className="h-6 w-6 text-emerald-500" />;
    case "unusual_spend":
    case "outlier":
      return <AlertTriangle className="h-6 w-6 text-amber-500" />;
    case "spending_pattern":
      return <PieChart className="h-6 w-6 text-blue-500" />;
    case "budget_warning":
      return <CreditCard className="h-6 w-6 text-rose-500" />;
    case "advice":
    default:
      return <Lightbulb className="h-6 w-6 text-indigo-500" />;
  }
};

const getInsightColor = (type: string) => {
  switch (type.toLowerCase()) {
    case "saving_opportunity":
      return "bg-emerald-50 border-emerald-100";
    case "unusual_spend":
    case "outlier":
      return "bg-amber-50 border-amber-100";
    case "spending_pattern":
      return "bg-blue-50 border-blue-100";
    case "budget_warning":
      return "bg-rose-50 border-rose-100";
    case "advice":
    default:
      return "bg-indigo-50 border-indigo-100";
  }
};

const getInsightBadge = (type: string) => {
  switch (type.toLowerCase()) {
    case "saving_opportunity":
      return "text-emerald-700 bg-emerald-100";
    case "unusual_spend":
    case "outlier":
      return "text-amber-700 bg-amber-100";
    case "spending_pattern":
      return "text-blue-700 bg-blue-100";
    case "budget_warning":
      return "text-rose-700 bg-rose-100";
    case "advice":
    default:
      return "text-indigo-700 bg-indigo-100";
  }
};

export default function InsightsPage() {
  const { data: response, isLoading, isError, refetch } = useInsights(20);
  const insights = response?.data || [];

  const { mutate: generateInsights, isPending: isGenerating } = useGenerateInsights();
  const { mutate: dismissInsight } = useDismissInsight();

  const handleGenerate = () => {
    generateInsights();
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dismissInsight(id);
  };
  
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-indigo-600" />
              AI Insights
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Personalized financial advice powered by AI
            </p>
          </div>
        </div>
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
          <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Failed to load insights</h3>
          <p className="mt-1 text-sm text-gray-500 mb-4">Something went wrong while fetching your insights.</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 sm:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-indigo-50 via-white to-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
        <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
          <Sparkles className="h-40 w-40 text-indigo-600" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-indigo-600" />
            AI Intelligence Engine
          </h1>
          <p className="mt-2 text-sm text-gray-600 max-w-xl">
            Our AI continuously analyzes your spending patterns, identifies saving
            opportunities, and provides personalized behavioral insights.
          </p>
        </div>
        <div className="relative z-10">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || isLoading}
            className="flex w-full items-center gap-2 sm:w-auto shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Analyzing..." : "Generate Insights"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 bg-gray-50">
          <Target className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Insights Yet</h3>
          <p className="mt-1 text-sm text-gray-500 mb-6 max-w-md mx-auto">
            We need a bit more transaction data to generate personalized insights. Add more transactions or trigger analysis.
          </p>
          <Button onClick={handleGenerate} disabled={isGenerating}>
             <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
             Force Analysis
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {insights.map((insight: Insight) => {
            const date = new Date(insight.generated_at);
            const formattedDate = format(date, "MMM d, yyyy");
            
            return (
              <div 
                key={insight.id}
                className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:shadow-md ${getInsightColor(insight.insight_type)}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white bg-opacity-80 rounded-xl shadow-sm backdrop-blur-sm">
                      {getInsightIcon(insight.insight_type)}
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${getInsightBadge(insight.insight_type)}`}>
                        {insight.insight_type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">
                        {insight.title}
                      </h3>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDismiss(insight.id, e)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-black/5 rounded-lg transition-colors"
                    title="Dismiss Insight"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mt-4 pl-16">
                  <p className="text-gray-700 text-base leading-relaxed">
                    {insight.body}
                  </p>
                  
                  <div className="mt-6 flex items-center gap-2 text-xs font-medium text-gray-500">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI Generated • {formattedDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
