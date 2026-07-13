"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { MOBILE_TABS, PRIMARY_NAV, SECONDARY_NAV } from "./navConfig";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { signOutUser } from "@/lib/firebase/auth";
import { cn } from "@/lib/utils/cn";

const MORE_ITEMS = [PRIMARY_NAV[4], ...SECONDARY_NAV];

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { appUser, household, isManager, role } = useAuth();
  const { resolved, setTheme } = useTheme();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const moreActive = MORE_ITEMS.some((i) => isActive(i.href));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border glass-strong safe-b lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
          {MOBILE_TABS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center gap-1 py-2.5"
              >
                <Icon
                  className={cn("size-6 transition-colors", active ? "text-brand" : "text-subtle")}
                  strokeWidth={active ? 2.2 : 1.9}
                />
                <span className={cn("text-[0.65rem] font-medium", active ? "text-brand" : "text-subtle")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-1 flex-col items-center gap-1 py-2.5"
          >
            <Menu className={cn("size-6", moreActive ? "text-brand" : "text-subtle")} strokeWidth={moreActive ? 2.2 : 1.9} />
            <span className={cn("text-[0.65rem] font-medium", moreActive ? "text-brand" : "text-subtle")}>More</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Menu">
        <div className="space-y-4 pb-2">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2 p-3">
            <Avatar
              name={appUser?.displayName ?? "Me"}
              photoURL={appUser?.photoURL}
              color={household?.members[appUser?.uid ?? ""]?.color}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{appUser?.displayName}</p>
              <p className="truncate text-xs text-subtle">{household?.name}</p>
            </div>
            <Badge tone={isManager ? "brand" : "neutral"}>{role === "manager" ? "Manager" : "Member"}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {MORE_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-sm font-medium transition-colors",
                    active ? "border-transparent bg-brand/10 text-brand" : "border-border text-foreground hover:bg-surface-2",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.9} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div className="flex items-center gap-3 text-sm font-medium text-foreground">
              {resolved === "dark" ? <Moon className="size-5" /> : <Sun className="size-5" />}
              Dark mode
            </div>
            <Switch checked={resolved === "dark"} onChange={(v) => setTheme(v ? "dark" : "light")} />
          </div>

          <button
            onClick={() => signOutUser()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-negative transition-colors hover:bg-negative/10"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </Sheet>
    </>
  );
}
