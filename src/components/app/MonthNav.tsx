"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useData } from "@/components/providers/HouseholdDataProvider";
import { isCurrentMonth, monthLabel } from "@/lib/format";
import { cn } from "@/lib/utils/cn";

export function MonthNav({ className }: { className?: string }) {
  const { month, stepMonth, canStepForward, canStepBack } = useData();
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-xl bg-surface-2 p-1", className)}>
      <button
        onClick={() => stepMonth(-1)}
        disabled={!canStepBack}
        className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground disabled:opacity-30"
        aria-label="Previous month"
      >
        <ChevronLeft className="size-5" />
      </button>
      <span className="min-w-[8.5rem] text-center text-sm font-semibold tabular-nums text-foreground">
        {isCurrentMonth(month) ? "This month" : monthLabel(month)}
      </span>
      <button
        onClick={() => stepMonth(1)}
        disabled={!canStepForward}
        className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground disabled:opacity-30"
        aria-label="Next month"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
