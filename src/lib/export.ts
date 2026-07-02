import type { Expense, HouseholdMember } from "./types";
import { CATEGORY_MAP } from "./constants";
import { formatDate } from "./format";

function escapeCsv(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Build a CSV of expenses with a share column per member. */
export function expensesToCsv(expenses: Expense[], members: HouseholdMember[]): string {
  const header = [
    "Date",
    "Description",
    "Category",
    "Paid by",
    "Amount",
    "Split",
    ...members.map((m) => `${m.displayName} share`),
    "Note",
  ];
  const byUid = Object.fromEntries(members.map((m) => [m.uid, m]));
  const rows = expenses.map((e) => [
    formatDate(e.date),
    e.description,
    CATEGORY_MAP[e.categoryId].label,
    byUid[e.paidBy]?.displayName ?? "Unknown",
    e.amount.toFixed(2),
    e.splitType,
    ...members.map((m) => (e.shares[m.uid] ? e.shares[m.uid].toFixed(2) : "")),
    e.notes,
  ]);
  return [header, ...rows].map((r) => r.map(escapeCsv).join(",")).join("\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
