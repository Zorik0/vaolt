"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { FullScreenLoader } from "@/components/app/FullScreenLoader";
import { SetupRequired } from "@/components/app/SetupRequired";

export default function Home() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "no-household") router.replace("/onboarding");
    else if (status === "ready") router.replace("/dashboard");
  }, [status, router]);

  if (status === "unconfigured") return <SetupRequired />;
  return <FullScreenLoader />;
}
