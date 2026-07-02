"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

/** Horizontal budget bar. Turns red past 100%. */
export function ProgressBar({
  ratio,
  color,
  className,
  height = 8,
}: {
  ratio: number;
  color?: string;
  className?: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(ratio, 1));
  const over = ratio > 1.0001;
  const fill = over ? "var(--negative)" : color ?? "var(--brand)";
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-surface-3", className)}
      style={{ height }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: fill }}
        initial={{ width: 0 }}
        animate={{ width: `${clamped * 100}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

/** Circular progress ring with centred content. */
export function ProgressRing({
  ratio,
  size = 120,
  stroke = 10,
  color,
  children,
  className,
}: {
  ratio: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(ratio, 1));
  const over = ratio > 1.0001;
  const strokeColor = over ? "var(--negative)" : color ?? "var(--brand)";
  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - clamped * c }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
