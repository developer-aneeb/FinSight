"use client";

import React from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import Card, { CardHeader } from "@/components/ui/Card";
import { cn } from "@/utils/cn";

interface DayData {
  date: string;
  amount: number;
}

interface SpendingHeatmapProps {
  data: DayData[];
  monthString: string; // YYYY-MM
}

export function SpendingHeatmap({ data, monthString }: SpendingHeatmapProps) {
  // Determine days in the given month
  const [year, month] = monthString.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 is Sunday

  // Get max spend for color scaling
  const maxSpend = Math.max(...data.map((d) => d.amount), 1);

  // Map data by day number
  const dataMap = new Map(
    data.map((d) => [new Date(d.date).getDate(), d.amount])
  );

  const getIntensityClass = (amount: number) => {
    if (amount === 0) return "bg-gray-100 border-gray-200";
    const ratio = amount / maxSpend;
    if (ratio > 0.75) return "bg-brand-700 border-brand-800 text-white";
    if (ratio > 0.5) return "bg-brand-500 border-brand-600 text-white";
    if (ratio > 0.25) return "bg-brand-300 border-brand-400";
    return "bg-brand-200 border-brand-300";
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card>
      <CardHeader>
        <h3 className="section-header mb-0">Daily Spending Heatmap</h3>
        <p className="text-sm text-gray-500 mt-1">Visualize intensity of spending throughout the month</p>
      </CardHeader>
      
      <div className="p-4 pt-0">
        <div className="overflow-x-auto">
          <div className="min-w-[340px] grid grid-cols-7 gap-1 sm:min-w-0">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 mb-1">
              {day}
            </div>
          ))}
          
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10 sm:h-12 bg-transparent" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const amount = dataMap.get(dayNum) || 0;
            
            return (
              <div
                key={dayNum}
                title={`Day ${dayNum}: ${formatCurrency(amount)}`}
                className={cn(
                  "group relative flex h-10 sm:h-12 flex-col items-center justify-center rounded border text-xs cursor-pointer transition-transform hover:scale-105",
                  getIntensityClass(amount)
                )}
              >
                <span className="font-semibold">{dayNum}</span>
                
                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 whitespace-nowrap group-hover:opacity-100 z-10 transition-opacity">
                  {formatCurrency(amount)}
                </div>
              </div>
            );
          })}
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gray-500">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="h-3 w-3 rounded bg-gray-100 border border-gray-200" />
            <div className="h-3 w-3 rounded bg-brand-200 border border-brand-300" />
            <div className="h-3 w-3 rounded bg-brand-300 border border-brand-400" />
            <div className="h-3 w-3 rounded bg-brand-500 border border-brand-600" />
            <div className="h-3 w-3 rounded bg-brand-700 border border-brand-800" />
          </div>
          <span>More</span>
        </div>
      </div>
    </Card>
  );
}
