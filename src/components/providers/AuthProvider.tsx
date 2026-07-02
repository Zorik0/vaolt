"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth, firebaseConfigured } from "@/lib/firebase/config";
import { ensureUserDoc, subscribeUserDoc } from "@/lib/db/users";
import { subscribeHousehold } from "@/lib/db/households";
import { LoadError } from "@/components/app/LoadError";
import type { AppUser, Household, HouseholdMember, Role } from "@/lib/types";

type Status =
  | "loading"
  | "unconfigured"
  | "unauthenticated"
  | "no-household"
  | "ready";

interface AuthContextValue {
  status: Status;
  firebaseUser: User | null;
  appUser: AppUser | null;
  household: Household | null;
  members: HouseholdMember[];
  uid: string | null;
  role: Role | null;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function describeError(err: unknown): string {
  const code =
    err instanceof FirebaseError
      ? err.code
      : typeof (err as { code?: unknown })?.code === "string"
        ? (err as { code: string }).code
        : "";
  if (code.includes("permission-denied"))
    return "Firestore denied access. Deploy the security rules (firestore.rules) — a database left in locked mode blocks everything.";
  if (code.includes("unavailable"))
    return "Couldn't reach Firestore. Check your connection and confirm a Cloud Firestore database exists in your Firebase project (in Native mode).";
  if (code.includes("failed-precondition"))
    return "Firestore isn't ready. If you just created the database, give it a moment and reload.";
  return err instanceof Error ? err.message : "Something went wrong loading your data.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null | undefined>(undefined);
  const [appUser, setAppUser] = useState<AppUser | null | undefined>(undefined);
  const [household, setHousehold] = useState<Household | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 1. Auth state
  useEffect(() => {
    if (!firebaseConfigured) return;
    return onAuthStateChanged(auth, (u) => setFirebaseUser(u ?? null));
  }, []);

  // 2. User profile document — subscribe first (works from cache/offline),
  //    then create the doc in the background if missing.
  useEffect(() => {
    if (!firebaseConfigured) return;
    if (firebaseUser === undefined) return;
    if (!firebaseUser) {
      setAppUser(null);
      return;
    }
    setLoadError(null);
    const unsub = subscribeUserDoc(
      firebaseUser.uid,
      (u) => setAppUser(u),
      (err) => setLoadError(describeError(err)),
    );
    ensureUserDoc(firebaseUser).catch(() => {
      /* creation may be denied or offline; the listener reports real errors */
    });
    return unsub;
  }, [firebaseUser]);

  // 3. Household document
  const householdId = appUser?.householdId ?? null;
  useEffect(() => {
    if (!firebaseConfigured) return;
    if (!householdId) {
      setHousehold(null);
      return;
    }
    setHousehold(undefined);
    return subscribeHousehold(
      householdId,
      (h) => setHousehold(h),
      (err) => setLoadError(describeError(err)),
    );
  }, [householdId]);

  // Safety net: if a signed-in user's profile never resolves and no error
  // fires (e.g. a silent listener stall), surface guidance instead of spinning.
  useEffect(() => {
    if (!firebaseUser || appUser !== undefined || loadError) return;
    const t = setTimeout(() => {
      setLoadError(
        "This is taking longer than expected — usually the Firestore security rules haven't been deployed, or the database hasn't been created yet.",
      );
    }, 18000);
    return () => clearTimeout(t);
  }, [firebaseUser, appUser, loadError]);

  const value = useMemo<AuthContextValue>(() => {
    const uid = firebaseUser?.uid ?? null;

    let status: Status;
    if (!firebaseConfigured) status = "unconfigured";
    else if (firebaseUser === undefined || appUser === undefined) status = "loading";
    else if (firebaseUser === null) status = "unauthenticated";
    else if (!householdId) status = "no-household";
    else if (household === undefined) status = "loading";
    else if (!household || !household.memberIds.includes(uid ?? "")) status = "no-household";
    else status = "ready";

    const activeHousehold = status === "ready" && household ? household : null;

    const members = activeHousehold
      ? Object.values(activeHousehold.members).sort((a, b) => {
          if (a.role !== b.role) return a.role === "manager" ? -1 : 1;
          return a.displayName.localeCompare(b.displayName);
        })
      : [];

    return {
      status,
      firebaseUser: firebaseUser ?? null,
      appUser: appUser ?? null,
      household: activeHousehold,
      members,
      uid,
      role: activeHousehold ? (activeHousehold.managerId === uid ? "manager" : "member") : null,
      isManager: !!activeHousehold && activeHousehold.managerId === uid,
    };
  }, [firebaseUser, appUser, household, householdId]);

  // Surface fatal load errors before the app resolves, instead of hanging.
  const showError = loadError && value.status !== "ready" && appUser === undefined;

  return (
    <AuthContext.Provider value={value}>
      {showError ? <LoadError message={loadError} signedIn={!!firebaseUser} /> : children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Convenience: look up a member's display info by uid. */
export function useMember(uid: string | null | undefined): HouseholdMember | null {
  const { household } = useAuth();
  if (!uid || !household) return null;
  return household.members[uid] ?? null;
}
