"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { HouseholdDataProvider } from "@/components/providers/HouseholdDataProvider";
import { ExpenseFormProvider } from "@/components/providers/ExpenseFormProvider";
import { AppChrome } from "@/components/app/AppChrome";
import { FullScreenLoader } from "@/components/app/FullScreenLoader";
import { SetupRequired } from "@/components/app/SetupRequired";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "no-household") router.replace("/onboarding");
  }, [status, router]);

  if (status === "unconfigured") return <SetupRequired />;
  if (status !== "ready") return <FullScreenLoader />;

  return (
    <HouseholdDataProvider>
      <ExpenseFormProvider>
        <AppChrome>{children}</AppChrome>
      </ExpenseFormProvider>
    </HouseholdDataProvider>
  );
}
