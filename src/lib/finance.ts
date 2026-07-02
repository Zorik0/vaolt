import type {
  BudgetMap,
  CategoryBudgetStatus,
  CategoryId,
  Expense,
  MemberBalance,
  Settlement,
  SplitType,
  Transfer,
} from "./types";
import { CATEGORIES } from "./constants";

/* --------------------------- money precision --------------------------- */
/** All internal arithmetic runs in integer paise to avoid float drift. */
export const toPaise = (rupees: number): number => Math.round((rupees || 0) * 100);
export const toRupees = (paise: number): number => paise / 100;

/**
 * Split a paise total across members as evenly as possible.
 * Any indivisible remainder (in paise) is handed to the earliest members,
 * so the parts always sum back to exactly `totalPaise`.
 */
export function distributePaise(totalPaise: number, uids: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  const n = uids.length;
  if (n === 0) return out;
  const base = Math.floor(totalPaise / n);
  let remainder = totalPaise - base * n;
  for (const uid of uids) {
    out[uid] = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
  }
  return out;
}

/**
 * Resolve the per-member share (in rupees) for an expense.
 * - equal  -> split evenly across `splitBetween`
 * - custom -> use provided amounts (normalised so they sum to `amount`)
 * - none   -> the payer bears the whole amount (not shared)
 */
export function resolveShares(
  amount: number,
  splitType: SplitType,
  splitBetween: string[],
  paidBy: string,
  custom?: Record<string, number>,
): Record<string, number> {
  const totalPaise = toPaise(amount);

  if (splitType === "none") {
    return { [paidBy]: toRupees(totalPaise) };
  }

  if (splitType === "custom" && custom) {
    const entries = Object.entries(custom).filter(([, v]) => v > 0);
    const sumPaise = entries.reduce((s, [, v]) => s + toPaise(v), 0);
    if (sumPaise === 0) return distributeToRupees(totalPaise, splitBetween);
    // Scale to match the true total, then fix any rounding residual.
    const scaled: Record<string, number> = {};
    let allocated = 0;
    entries.forEach(([uid, v], i) => {
      const share =
        i === entries.length - 1
          ? totalPaise - allocated
          : Math.round((toPaise(v) / sumPaise) * totalPaise);
      scaled[uid] = share;
      allocated += share;
    });
    return mapToRupees(scaled);
  }

  return distributeToRupees(totalPaise, splitBetween);
}

function distributeToRupees(totalPaise: number, uids: string[]): Record<string, number> {
  return mapToRupees(distributePaise(totalPaise, uids));
}
function mapToRupees(paiseMap: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(paiseMap)) out[k] = toRupees(v);
  return out;
}

/* ------------------------------ balances ------------------------------ */

/**
 * Compute each member's standing for a set of expenses + settlements.
 * `net > 0` => the member is owed money; `net < 0` => the member owes.
 */
export function computeBalances(
  memberIds: string[],
  expenses: Expense[],
  settlements: Settlement[],
): MemberBalance[] {
  const paid: Record<string, number> = {};
  const share: Record<string, number> = {};
  const settledOut: Record<string, number> = {};
  const settledIn: Record<string, number> = {};
  for (const uid of memberIds) {
    paid[uid] = 0;
    share[uid] = 0;
    settledOut[uid] = 0;
    settledIn[uid] = 0;
  }

  for (const e of expenses) {
    paid[e.paidBy] = (paid[e.paidBy] ?? 0) + toPaise(e.amount);
    for (const [uid, amt] of Object.entries(e.shares || {})) {
      share[uid] = (share[uid] ?? 0) + toPaise(amt);
    }
  }

  for (const s of settlements) {
    if (s.status !== "completed") continue;
    settledOut[s.fromUid] = (settledOut[s.fromUid] ?? 0) + toPaise(s.amount);
    settledIn[s.toUid] = (settledIn[s.toUid] ?? 0) + toPaise(s.amount);
  }

  return memberIds.map((uid) => {
    const netPaise = (paid[uid] ?? 0) - (share[uid] ?? 0) + (settledOut[uid] ?? 0) - (settledIn[uid] ?? 0);
    return {
      uid,
      paid: toRupees(paid[uid] ?? 0),
      share: toRupees(share[uid] ?? 0),
      settledOut: toRupees(settledOut[uid] ?? 0),
      settledIn: toRupees(settledIn[uid] ?? 0),
      net: toRupees(netPaise),
    };
  });
}

/**
 * Reduce a set of balances to the *minimum* number of transfers that settles
 * everyone. Uses a greedy largest-creditor / largest-debtor match, which is
 * optimal for the small member counts a household has.
 */
export function minimizeTransfers(balances: MemberBalance[]): Transfer[] {
  const creditors: { uid: string; amt: number }[] = [];
  const debtors: { uid: string; amt: number }[] = [];

  for (const b of balances) {
    const paise = toPaise(b.net);
    if (paise > 0) creditors.push({ uid: b.uid, amt: paise });
    else if (paise < 0) debtors.push({ uid: b.uid, amt: -paise });
  }

  creditors.sort((a, b) => b.amt - a.amt);
  debtors.sort((a, b) => b.amt - a.amt);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    if (pay > 0) {
      transfers.push({
        fromUid: debtors[i].uid,
        toUid: creditors[j].uid,
        amount: toRupees(pay),
      });
    }
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt <= 0) i += 1;
    if (creditors[j].amt <= 0) j += 1;
  }
  return transfers;
}

/**
 * Net pairwise position between two members derived from the transfer set —
 * "A owes B ₹X". Convenience for a directed member-to-member view.
 */
export function pairwiseFromTransfers(transfers: Transfer[]): Transfer[] {
  return transfers.filter((t) => t.amount > 0.005);
}

/* ------------------------------ budgets ------------------------------- */

export function categorySpend(expenses: Expense[]): Record<CategoryId, number> {
  const totals = {} as Record<CategoryId, number>;
  for (const c of CATEGORIES) totals[c.id] = 0;
  let acc: Record<string, number> = {};
  for (const e of expenses) acc[e.categoryId] = (acc[e.categoryId] ?? 0) + toPaise(e.amount);
  for (const c of CATEGORIES) totals[c.id] = toRupees(acc[c.id] ?? 0);
  return totals;
}

export function computeBudgetStatus(
  expenses: Expense[],
  budgets: BudgetMap,
): CategoryBudgetStatus[] {
  const spendPaise: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const e of expenses) {
    spendPaise[e.categoryId] = (spendPaise[e.categoryId] ?? 0) + toPaise(e.amount);
    counts[e.categoryId] = (counts[e.categoryId] ?? 0) + 1;
  }
  return CATEGORIES.map((c) => {
    const budget = budgets[c.id] ?? 0;
    const spent = toRupees(spendPaise[c.id] ?? 0);
    const remaining = budget - spent;
    return {
      categoryId: c.id,
      budget,
      spent,
      remaining,
      ratio: budget > 0 ? spent / budget : 0,
      count: counts[c.id] ?? 0,
    };
  });
}

export function totalBudget(budgets: BudgetMap): number {
  return Object.values(budgets).reduce((s, v) => s + (v ?? 0), 0);
}

export function sumExpenses(expenses: Expense[]): number {
  return toRupees(expenses.reduce((s, e) => s + toPaise(e.amount), 0));
}

/* --------------------------- analytics aggregation --------------------- */

/** Total paid per member (for contribution charts). */
export function paidByMember(expenses: Expense[], memberIds: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const uid of memberIds) out[uid] = 0;
  for (const e of expenses) out[e.paidBy] = (out[e.paidBy] ?? 0) + toPaise(e.amount);
  for (const uid of Object.keys(out)) out[uid] = toRupees(out[uid]);
  return out;
}

/** Daily spend series for a month key ("YYYY-MM"). */
export function dailySeries(expenses: Expense[], monthKeyStr: string): { day: number; total: number }[] {
  const [y, m] = monthKeyStr.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  const buckets = new Array(days).fill(0);
  for (const e of expenses) {
    const d = new Date(e.date);
    if (d.getFullYear() === y && d.getMonth() === m - 1) {
      buckets[d.getDate() - 1] += toPaise(e.amount);
    }
  }
  return buckets.map((v, i) => ({ day: i + 1, total: toRupees(v) }));
}
