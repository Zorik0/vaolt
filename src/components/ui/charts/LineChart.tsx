"use client";

import { motion } from "framer-motion";
import { useId } from "react";

export interface LinePoint {
  label: string;
  value: number;
}

/** Responsive area + line chart. Scales to its container width. */
export function LineChart({
  data,
  height = 180,
  color = "var(--brand)",
}: {
  data: LinePoint[];
  height?: number;
  color?: string;
}) {
  const id = useId();
  const W = 100;
  const H = 40;
  const pad = 2;
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;

  if (n === 0) return null;

  const x = (i: number) => (n === 1 ? W / 2 : pad + (i / (n - 1)) * (W - pad * 2));
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.value)}`).join(" ");
  const area = `${line} L ${x(n - 1)} ${H} L ${x(0)} ${H} Z`;

  return (
    <div className="w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="size-full overflow-visible"
      >
        <defs>
          <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={area}
          fill={`url(#grad-${id})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.circle
          cx={x(n - 1)}
          cy={y(data[n - 1].value)}
          r="1.3"
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.9, type: "spring", stiffness: 400 }}
          style={{ transformOrigin: "center" }}
        />
      </svg>
    </div>
  );
}
