"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, LogOut, Plus, Users } from "lucide-react";
import { Logo } from "@/components/app/Logo";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { FullScreenLoader } from "@/components/app/FullScreenLoader";
import { useAuth } from "@/components/providers/AuthProvider";
import { createHousehold, joinHousehold } from "@/lib/db/households";
import { signOutUser } from "@/lib/firebase/auth";
import { DEFAULT_BUDGETS } from "@/lib/constants";
import { money } from "@/lib/format";
import { totalBudget } from "@/lib/finance";

export default function OnboardingPage() {
  const { status, appUser } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "ready") router.replace("/dashboard");
  }, [status, router]);

  if (status !== "no-household" || !appUser) return <FullScreenLoader />;

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "create") {
        if (!name.trim()) throw new Error("Give your household a name.");
        await createHousehold(appUser, name);
      } else {
        if (code.trim().length < 4) throw new Error("Enter a valid invite code.");
        await joinHousehold(appUser, code);
      }
      // Auth state updates and the effect above redirects to the dashboard.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Logo size={34} />
          <button
            onClick={() => signOutUser()}
            className="flex items-center gap-1.5 text-sm font-medium text-subtle transition-colors hover:text-foreground"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-6 shadow-soft-md sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Welcome, {appUser.displayName.split(" ")[0]}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Set up your household to start tracking shared expenses.
          </p>

          <div className="mt-6">
            <SegmentedControl
              value={mode}
              onChange={(v) => {
                setMode(v);
                setError("");
              }}
              options={[
                { value: "create", label: "Create", icon: <Plus className="size-4" /> },
                { value: "join", label: "Join", icon: <Users className="size-4" /> },
              ]}
            />
          </div>

          <div className="mt-6 space-y-4">
            {mode === "create" ? (
              <>
                <Field label="Household name" hint="You'll be the house manager.">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Flat 402, Sunrise Apartments"
                    autoFocus
                  />
                </Field>
                <div className="rounded-2xl bg-surface-2 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Home className="size-4 text-brand" />
                    Starter monthly budget
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    We&apos;ll pre-fill {money(totalBudget(DEFAULT_BUDGETS))} across rent, maintenance,
                    utilities, WiFi and groceries. You can edit everything later.
                  </p>
                </div>
              </>
            ) : (
              <Field label="Invite code" hint="Ask your house manager for the 6-character code.">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="ABC123"
                  maxLength={6}
                  autoFocus
                  className="text-center text-lg font-semibold uppercase tracking-[0.3em]"
                />
              </Field>
            )}

            {error && <p className="text-sm font-medium text-negative">{error}</p>}

            <Button className="w-full" size="lg" onClick={submit} loading={loading}>
              {mode === "create" ? "Create household" : "Join household"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
