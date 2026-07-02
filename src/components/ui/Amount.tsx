import { cn } from "@/lib/utils/cn";
import { money } from "@/lib/format";

export function Amount({
  value,
  decimals,
  signed,
  colorize,
  absolute,
  className,
}: {
  value: number;
  decimals?: boolean;
  signed?: boolean;
  /** Tint positive green / negative red. */
  colorize?: boolean;
  absolute?: boolean;
  className?: string;
}) {
  const color = colorize
    ? value > 0.004
      ? "text-positive"
      : value < -0.004
        ? "text-negative"
        : "text-muted"
    : undefined;
  return (
    <span className={cn("tnum tabular-nums", color, className)}>
      {money(value, { decimals, signed, absolute })}
    </span>
  );
}
