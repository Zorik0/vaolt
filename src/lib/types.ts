import type { Timestamp } from "firebase/firestore";

/** Role within a household. */
export type Role = "manager" | "member";

/** Budgeted spending categories. `other` is the uncategorised catch-all. */
export type CategoryId =
  | "rent"
  | "maintenance"
  | "water"
  | "electricity"
  | "groceries"
  | "wifi"
  | "other";

/** How an expense is divided across members. */
export type SplitType = "equal" | "custom" | "none";

/** A signed-in application user (mirrors an `auth` user). */
export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  householdId: string | null;
  role: Role | null;
  createdAt?: Timestamp;
}

/** A member as denormalised on the household document for fast display. */
export interface HouseholdMember {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  role: Role;
  color: string;
  joinedAt?: Timestamp;
}

/** Per-category monthly budget amounts (in rupees). */
export type BudgetMap = Partial<Record<CategoryId, number>>;

export interface Household {
  id: string;
  name: string;
  managerId: string;
  memberIds: string[];
  members: Record<string, HouseholdMember>;
  budgets: BudgetMap;
  currency: string;
  inviteCode: string;
  createdAt?: Timestamp;
}

export interface Expense {
  id: string;
  amount: number;
  categoryId: CategoryId;
  description: string;
  paidBy: string;
  splitType: SplitType;
  splitBetween: string[];
  /** Resolved amount each member owes for this expense (sums to `amount`). */
  shares: Record<string, number>;
  /** When the expense occurred (epoch millis). */
  date: number;
  month: string; // "YYYY-MM"
  isRecurring: boolean;
  recurringId: string | null;
  receiptUrl: string | null;
  receiptPath: string | null;
  notes: string;
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/** Draft shape used by the create/edit expense form. */
export interface ExpenseDraft {
  amount: number;
  categoryId: CategoryId;
  description: string;
  paidBy: string;
  splitType: SplitType;
  splitBetween: string[];
  shares: Record<string, number>;
  date: number;
  notes: string;
  receiptUrl: string | null;
  receiptPath: string | null;
  isRecurring: boolean;
  recurringId: string | null;
}

export type SettlementStatus = "pending" | "completed";

export interface Settlement {
  id: string;
  fromUid: string;
  toUid: string;
  amount: number;
  status: SettlementStatus;
  method: string;
  note: string;
  month: string;
  createdBy: string;
  createdAt?: Timestamp;
  completedAt?: Timestamp | null;
}

export interface RecurringExpense {
  id: string;
  amount: number;
  categoryId: CategoryId;
  description: string;
  paidBy: string;
  splitType: SplitType;
  splitBetween: string[];
  dayOfMonth: number;
  active: boolean;
  lastGenerated: string | null; // "YYYY-MM"
  createdBy: string;
  createdAt?: Timestamp;
}

/** Derived: a member's monthly financial standing. */
export interface MemberBalance {
  uid: string;
  paid: number; // total they paid out
  share: number; // total they are responsible for
  settledOut: number; // completed settlements they sent
  settledIn: number; // completed settlements they received
  net: number; // positive => owed money, negative => owes money
}

/** Derived: a single suggested transfer to settle up. */
export interface Transfer {
  fromUid: string;
  toUid: string;
  amount: number;
}

/** Derived: spending against budget for one category. */
export interface CategoryBudgetStatus {
  categoryId: CategoryId;
  budget: number;
  spent: number;
  remaining: number;
  ratio: number; // spent / budget (0 when no budget)
  count: number;
}
