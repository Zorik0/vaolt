import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface/50 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-subtle">
        <Icon className="size-7" strokeWidth={1.75} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
