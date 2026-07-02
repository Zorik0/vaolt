import { cn } from "@/lib/utils/cn";
import { APP_NAME } from "@/lib/constants";

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width="40" height="40" rx="9" fill="var(--brand)" />
      <path
        d="M11 20 L20 12.5 L29 20"
        stroke="var(--brand-contrast)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 21.5 V27.5 H26.5 V21.5"
        stroke="var(--brand-contrast)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M17 27.5 V23.5 H23 V27.5" stroke="var(--brand-contrast)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
    </svg>
  );
}

export function Logo({
  size = 36,
  className,
  showWordmark = true,
}: {
  size?: number;
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight text-foreground">{APP_NAME}</span>
      )}
    </div>
  );
}
