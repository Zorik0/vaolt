"use client";

import { motion } from "framer-motion";

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

function polar(cx: number, cy: number, r: number, angle: number) {
  const a = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arc(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polar(cx, cy, r, start);
  const e = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export function DonutChart({
  data,
  size = 180,
  stroke = 22,
  children,
  gap = 2,
}: {
  data: DonutDatum[];
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
  gap?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const active = data.filter((d) => d.value > 0);

  let acc = 0;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        {total > 0 &&
          active.map((d, i) => {
            const frac = d.value / total;
            const start = acc * 360;
            const end = (acc + frac) * 360;
            acc += frac;
            const g = active.length > 1 ? gap : 0;
            if (frac >= 0.999) {
              return (
                <motion.circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={stroke}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              );
            }
            return (
              <motion.path
                key={i}
                d={arc(cx, cy, r, start + g / 2, end - g / 2)}
                fill="none"
                stroke={d.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              />
            );
          })}
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center">{children}</div>}
    </div>
  );
}
