"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
  sublabel?: string;
}

export function BarChart({
  data,
  height = 160,
  formatValue,
  className,
  rounded = 8,
}: {
  data: BarDatum[];
  height?: number;
  formatValue?: (v: number) => string;
  className?: string;
  rounded?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  // With many bars there's no room for every label; keep the last month's
  // label and thin out the rest so nothing ellipsizes.
  const labelStep = data.length > 9 ? 2 : 1;
  const showLabel = (i: number) => (data.length - 1 - i) % labelStep === 0;
  return (
    <div className={cn("flex gap-1.5 sm:gap-2", className)} style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * 100;
        return (
          <div key={i} className="group flex min-w-0 flex-1 flex-col gap-2">
            {/* Bars are absolutely positioned so their percentage heights
                resolve against the track even inside a flex column. */}
            <div className="relative min-h-0 flex-1">
              {d.value > 0 && (
                <span className="pointer-events-none absolute -top-0.5 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap text-[0.65rem] font-semibold text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  {formatValue ? formatValue(d.value) : d.value}
                </span>
              )}
              <motion.div
                className="absolute bottom-0 left-1/2 w-full max-w-[2.5rem] -translate-x-1/2"
                style={{
                  backgroundColor: d.color ?? "var(--brand)",
                  borderRadius: rounded,
                }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(h, d.value > 0 ? 3 : 0)}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 18, delay: i * 0.015 }}
              />
            </div>
            <span className="w-full overflow-hidden whitespace-nowrap text-center text-[0.65rem] font-medium text-subtle">
              {showLabel(i) ? d.label : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
