import type { BudgetMap, CategoryId } from "./types";

export const APP_NAME = "Vaolt";
export const APP_TAGLINE = "Shared home finances, perfectly clear.";
export const CURRENCY = "INR";
export const LOCALE = "en-IN";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  /** Accent colour used across chips, charts and progress. */
  color: string;
  /** Whether the category is fixed each month (rent, wifi…) vs variable. */
  fixed: boolean;
  description: string;
}

/**
 * The household's spending categories. Order here drives display order.
 * `other` is the catch-all with no default budget.
 */
export const CATEGORIES: CategoryMeta[] = [
  { id: "rent", label: "Rent", color: "#3a6b8a", fixed: true, description: "Monthly apartment rent" },
  { id: "maintenance", label: "Maintenance", color: "#7d6a9c", fixed: true, description: "Society maintenance" },
  { id: "electricity", label: "Electricity", color: "#c08a2d", fixed: false, description: "Power bill" },
  { id: "water", label: "Water", color: "#3f8fa0", fixed: false, description: "Water charges" },
  { id: "wifi", label: "WiFi", color: "#b1566a", fixed: true, description: "Internet / broadband" },
  { id: "groceries", label: "Groceries", color: "#5c8a46", fixed: false, description: "Food & household supplies" },
  { id: "other", label: "Other", color: "#8b8578", fixed: false, description: "Everything else" },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CategoryId, CategoryMeta>,
);

/** Default monthly budgets (₹) from the household plan. */
export const DEFAULT_BUDGETS: BudgetMap = {
  rent: 21000,
  maintenance: 2000,
  water: 500,
  electricity: 1000,
  groceries: 4000,
  wifi: 1000,
  other: 0,
};

/** Palette assigned to members in join order — legible on light & dark. */
export const MEMBER_COLORS = [
  "#1c6249",
  "#b06a1e",
  "#3563a0",
  "#a23f5e",
  "#4f7d3f",
  "#7a6a9b",
];

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: "home" as const },
  { href: "/expenses", label: "Expenses", icon: "receipt" as const },
  { href: "/budgets", label: "Budgets", icon: "target" as const },
  { href: "/balances", label: "Balances", icon: "scale" as const },
  { href: "/reports", label: "Reports", icon: "chart" as const },
];

export const SETTLEMENT_METHODS = [
  "UPI",
  "Cash",
  "Bank transfer",
  "Other",
] as const;
