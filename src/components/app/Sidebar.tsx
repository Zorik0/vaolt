"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Plus, Sun } from "lucide-react";
import { Logo } from "./Logo";
import { PRIMARY_NAV, SECONDARY_NAV, type NavItem } from "./navConfig";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useExpenseForm } from "@/components/providers/ExpenseFormProvider";
import { cn } from "@/lib/utils/cn";

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-brand/10 text-brand" : "text-muted hover:bg-surface-2 hover:text-foreground",
      )}
    >
      <Icon className="size-[1.15rem]" strokeWidth={active ? 2.2 : 1.9} />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { household, appUser, isManager, role } = useAuth();
  const { resolved, toggle } = useTheme();
  const { openNew } = useExpenseForm();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const secondary = SECONDARY_NAV.filter((i) => !i.managerOnly || isManager);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface/60 px-4 py-5 lg:flex">
      <div className="flex items-center justify-between px-1">
        <Logo size={32} />
        <button
          onClick={toggle}
          className="grid size-9 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          aria-label="Toggle theme"
        >
          {resolved === "dark" ? <Sun className="size-[1.15rem]" /> : <Moon className="size-[1.15rem]" />}
        </button>
      </div>

      <div className="mt-2 truncate px-1 text-xs font-medium text-subtle">{household?.name}</div>

      {isManager && (
        <Button className="mt-4" icon={<Plus className="size-[1.15rem]" />} onClick={() => openNew()}>
          Add expense
        </Button>
      )}

      <nav className="mt-5 flex flex-1 flex-col gap-0.5">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
        <div className="my-3 h-px bg-border" />
        {secondary.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>

      <Link
        href="/settings"
        className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface p-2.5 transition-colors hover:bg-surface-2"
      >
        <Avatar
          name={appUser?.displayName ?? "Me"}
          photoURL={appUser?.photoURL}
          color={household?.members[appUser?.uid ?? ""]?.color}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{appUser?.displayName}</p>
          <p className="truncate text-xs text-subtle">{appUser?.email}</p>
        </div>
        <Badge tone={isManager ? "brand" : "neutral"}>{role === "manager" ? "Manager" : "Member"}</Badge>
      </Link>
    </aside>
  );
}
