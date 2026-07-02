"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface Segment<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: {
  options: Segment<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  const id = useId();
  return (
    <div
      className={cn(
        "inline-flex w-full items-center gap-1 rounded-xl bg-surface-2 p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1.5 rounded-lg font-medium transition-colors duration-150",
              size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm",
              active ? "text-foreground" : "text-muted hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-lg bg-surface shadow-soft-sm"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
              {opt.icon}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
