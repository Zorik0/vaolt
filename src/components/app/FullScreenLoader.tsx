import { LogoMark } from "./Logo";

export function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
      <div className="animate-pulse">
        <LogoMark size={52} />
      </div>
      {label && <p className="text-sm text-muted">{label}</p>}
    </div>
  );
}
