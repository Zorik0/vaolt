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
  return (
    <div className={cn("flex items-end gap-2", className)} style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * 100;
        return (
          <div key={i} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <div className="relative flex w-full flex-1 items-end justify-center">
              {d.value > 0 && (
                <span className="pointer-events-none absolute -top-0.5 -translate-y-full whitespace-nowrap text-[0.65rem] font-semibold text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  {formatValue ? formatValue(d.value) : d.value}
                </span>
              )}
              <motion.div
                className="w-full max-w-[2.5rem] rounded-full"
                style={{
                  backgroundColor: d.color ?? "var(--brand)",
                  borderRadius: rounded,
                }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(h, d.value > 0 ? 3 : 0)}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 18, delay: i * 0.015 }}
              />
            </div>
            <span className="w-full truncate text-center text-[0.65rem] font-medium text-subtle">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
