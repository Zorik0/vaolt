import { CloudOff } from "lucide-react";
import { Logo } from "@/components/app/Logo";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo size={38} />
      <div className="grid size-16 place-items-center rounded-2xl bg-surface-2 text-subtle">
        <CloudOff className="size-8" strokeWidth={1.75} />
      </div>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">You&apos;re offline</h1>
        <p className="mt-1.5 max-w-xs text-sm text-muted">
          Vaolt needs a connection to load fresh data. Your recent expenses are still available once
          you reconnect.
        </p>
      </div>
    </div>
  );
}
