"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/Button";
import { signOutUser } from "@/lib/firebase/auth";

const CHECKS = [
  "Deploy security rules: firebase deploy --only firestore:rules,storage",
  "Create a Cloud Firestore database (Native mode), not just Realtime Database",
  "Enable the Email/Password and Google sign-in providers",
  "Add this domain under Authentication → Settings → Authorized domains",
];

export function LoadError({ message, signedIn }: { message: string; signedIn: boolean }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-md">
        <Logo size={34} className="mb-8 justify-center" />
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-soft-sm sm:p-8">
          <div className="grid size-11 place-items-center rounded-xl bg-negative/10 text-negative">
            <TriangleAlert className="size-6" />
          </div>
          <h1 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
            Couldn&apos;t load your data
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>

          <ul className="mt-5 space-y-2 border-t border-border pt-5">
            {CHECKS.map((c) => (
              <li key={c} className="flex gap-2.5 text-xs text-muted">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-subtle" />
                <span className="font-mono leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex gap-3">
            <Button className="flex-1" icon={<RefreshCw className="size-4" />} onClick={() => window.location.reload()}>
              Try again
            </Button>
            {signedIn && (
              <Button variant="secondary" onClick={() => signOutUser()}>
                Sign out
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
