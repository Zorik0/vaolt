"use client";

import { cn } from "@/lib/utils/cn";

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50",
        checked ? "bg-brand" : "bg-surface-3",
      )}
    >
      <span
        className={cn(
          "inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-[1.375rem]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
