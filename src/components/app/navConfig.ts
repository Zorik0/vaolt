import {
  ArrowLeftRight,
  LayoutGrid,
  Receipt,
  Repeat,
  Settings,
  Target,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/budgets", label: "Budgets", icon: Target },
  { href: "/balances", label: "Balances", icon: ArrowLeftRight },
  { href: "/reports", label: "Reports", icon: Wallet },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Bottom-tab items on mobile (the 5th slot is a "More" menu). */
export const MOBILE_TABS: NavItem[] = PRIMARY_NAV.slice(0, 4);
