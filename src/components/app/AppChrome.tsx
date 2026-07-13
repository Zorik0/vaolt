"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CloudOff, Plus } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { LogoMark } from "./Logo";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useExpenseForm } from "@/components/providers/ExpenseFormProvider";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { APP_NAME } from "@/lib/constants";

function OfflineIndicator() {
  const online = useOnlineStatus();
  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed inset-x-0 top-0 z-40 flex items-center justify-center gap-2 bg-foreground py-1.5 text-xs font-medium text-background safe-t"
        >
          <CloudOff className="size-3.5" />
          You&apos;re offline — changes will sync when you reconnect
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MobileTopBar() {
  const { appUser, household } = useAuth();
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-background px-4 pb-3 pt-3 safe-t lg:hidden">
      <Link href="/dashboard" className="flex items-center gap-2">
        <LogoMark size={28} />
        <span className="font-semibold tracking-tight text-foreground">{APP_NAME}</span>
      </Link>
      <Link href="/settings" aria-label="Settings">
        <Avatar
          name={appUser?.displayName ?? "Me"}
          photoURL={appUser?.photoURL}
          color={household?.members[appUser?.uid ?? ""]?.color}
          size="sm"
        />
      </Link>
    </header>
  );
}

function MobileFab() {
  const { openNew } = useExpenseForm();
  return (
    <button
      onClick={() => openNew()}
      aria-label="Add expense"
      className="fixed bottom-[calc(var(--nav-height)+1rem)] right-4 z-50 grid size-14 place-items-center rounded-full bg-brand text-brand-contrast shadow-soft-xl ring-1 ring-brand-strong/40 transition-transform hover:scale-105 active:scale-90 lg:hidden"
    >
      <Plus className="size-7" strokeWidth={2.4} />
    </button>
  );
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <OfflineIndicator />
      <Sidebar />
      <div className="lg:pl-64">
        <MobileTopBar />
        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 sm:px-6 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>
      <MobileFab />
      <BottomNav />
    </div>
  );
}
