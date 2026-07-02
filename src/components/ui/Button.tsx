import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-brand-contrast shadow-soft-sm hover:bg-brand-strong active:brightness-95",
  secondary:
    "bg-surface text-foreground border border-border-strong hover:bg-surface-2 active:bg-surface-3",
  subtle: "bg-surface-2 text-foreground hover:bg-surface-3 active:brightness-95",
  ghost: "text-muted hover:bg-surface-2 hover:text-foreground",
  danger:
    "bg-negative/10 text-negative hover:bg-negative/15 active:bg-negative/20",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-xl gap-1.5",
  md: "h-11 px-4 text-[0.95rem] rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-2xl gap-2",
  icon: "size-10 rounded-xl",
};

export const buttonClass = (
  variant: Variant = "primary",
  size: Size = "md",
  className?: string,
) =>
  cn(
    "inline-flex select-none items-center justify-center font-medium transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, icon, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
});
