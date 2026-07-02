import { cn } from "@/lib/utils/cn";

export function StatTile({
  label,
  value,
  sub,
  icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-4 shadow-soft-sm", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-subtle">{label}</span>
        {icon && <span className="text-subtle">{icon}</span>}
      </div>
      <div className="mt-2 text-xl font-semibold tracking-tight text-foreground">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}
