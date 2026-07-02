"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/app/Logo";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { FullScreenLoader } from "@/components/app/FullScreenLoader";
import { SetupRequired } from "@/components/app/SetupRequired";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  authErrorMessage,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/firebase/auth";
import { APP_NAME } from "@/lib/constants";

const LEDGER = [
  { label: "Priya → Aarav", amount: "₹7,040" },
  { label: "Karan → Aarav", amount: "₹6,760" },
];

export default function LoginPage() {
  const { status } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "no-household") router.replace("/onboarding");
    else if (status === "ready") router.replace("/dashboard");
  }, [status, router]);

  if (status === "unconfigured") return <SetupRequired />;
  if (status === "loading" || status === "ready" || status === "no-household")
    return <FullScreenLoader />;

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      if (e instanceof FirebaseError) setError(authErrorMessage(e.code));
      else setError("Couldn't sign in with Google.");
      setGoogleLoading(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") await signUpWithEmail(name, email, password);
      else await signInWithEmail(email, password);
    } catch (err) {
      if (err instanceof FirebaseError) setError(authErrorMessage(err.code));
      else setError("Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-brand p-12 text-brand-contrast lg:flex">
        <Logo size={34} className="[&_span]:text-brand-contrast" />
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-brand-contrast/55">
            The household ledger
          </p>
          <h2 className="mt-4 max-w-md text-[2.15rem] font-semibold leading-[1.12] tracking-tight text-balance">
            Every rupee accounted for. Settled in the fewest transfers.
          </h2>

          <div className="mt-9 max-w-sm rounded-2xl border border-current/15 bg-current/[0.07] p-5">
            <div className="flex items-center justify-between text-[0.7rem] font-medium uppercase tracking-wide text-brand-contrast/60">
              <span>Settle up · July</span>
              <span>2 transfers</span>
            </div>
            <div className="mt-3.5 space-y-3">
              {LEDGER.map((r) => (
                <div key={r.label} className="flex items-center justify-between border-t border-current/10 pt-3 first:border-0 first:pt-0">
                  <span className="text-sm text-brand-contrast/85">{r.label}</span>
                  <span className="font-mono text-sm tabular-nums">{r.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-brand-contrast/55">
          {APP_NAME} · Built for roommates who value transparency
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <Logo size={36} className="mb-8 lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {mode === "signin"
              ? "Sign in to manage your household."
              : "Start tracking shared expenses in minutes."}
          </p>

          <div className="mt-7">
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={handleGoogle}
              loading={googleLoading}
              icon={<GoogleIcon />}
            >
              Continue with Google
            </Button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-subtle">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <Field label="Name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </Field>
            )}
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Password">
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-subtle hover:text-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>

            {error && <p className="text-sm font-medium text-negative">{error}</p>}

            <Button type="submit" size="lg" className="w-full" loading={loading} icon={<ArrowRight className="size-[1.1rem]" />}>
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError("");
              }}
              className="font-semibold text-brand hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-[1.15rem]" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
