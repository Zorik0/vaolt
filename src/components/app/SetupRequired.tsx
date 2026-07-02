import { KeyRound } from "lucide-react";
import { Logo } from "./Logo";

const ENV_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

export function SetupRequired() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-lg">
        <Logo size={40} className="mb-8 justify-center" />
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-soft-md sm:p-8">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand">
            <KeyRound className="size-6" />
          </div>
          <h1 className="mt-4 text-center text-xl font-semibold tracking-tight text-foreground">
            Connect Firebase to continue
          </h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-muted">
            Add your Firebase project credentials to a{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs font-medium text-foreground">
              .env.local
            </code>{" "}
            file in the project root, then restart the dev server.
          </p>
          <div className="mt-5 space-y-1.5 rounded-2xl bg-surface-2 p-4 font-mono text-xs text-muted">
            {ENV_KEYS.map((k) => (
              <div key={k} className="flex items-center gap-2">
                <span className="text-subtle">•</span>
                <span className="truncate">{k}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-subtle">
            Find these under Project settings → Your apps in the Firebase console. See{" "}
            <code className="rounded bg-surface-2 px-1 py-0.5">README.md</code> for the full setup guide.
          </p>
        </div>
      </div>
    </div>
  );
}
