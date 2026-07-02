import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export function Field({
  label,
  hint,
  error,
  children,
  className,
  required,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="flex items-center gap-1 text-sm font-medium text-muted">
          {label}
          {required && <span className="text-negative">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-negative">{error}</p>
      ) : hint ? (
        <p className="text-xs text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

const baseInput =
  "w-full rounded-xl border border-border bg-surface-2 px-3.5 text-[0.95rem] text-foreground placeholder:text-subtle transition-colors focus:border-brand focus:bg-surface";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(baseInput, "h-11", invalid && "border-negative focus:border-negative", className)}
        {...props}
      />
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(baseInput, "min-h-[5rem] resize-none py-2.5 leading-relaxed", className)}
        {...props}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(baseInput, "h-11 appearance-none pr-9", className)}
          {...props}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-subtle"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  },
);
