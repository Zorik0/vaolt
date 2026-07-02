import {
  addDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Expense, ExpenseDraft } from "../types";
import { monthKey } from "../format";
import { resolveShares } from "../finance";
import { expenseConverter, expenseDoc, expensesCol } from "./converters";

/** Recompute the authoritative shares + month before persisting a draft. */
function materialise(draft: ExpenseDraft) {
  const shares = resolveShares(
    draft.amount,
    draft.splitType,
    draft.splitBetween,
    draft.paidBy,
    draft.shares,
  );
  return {
    amount: draft.amount,
    categoryId: draft.categoryId,
    description: draft.description.trim(),
    paidBy: draft.paidBy,
    splitType: draft.splitType,
    splitBetween: draft.splitBetween,
    shares,
    date: draft.date,
    month: monthKey(draft.date),
    isRecurring: draft.isRecurring,
    recurringId: draft.recurringId,
    receiptUrl: draft.receiptUrl,
    receiptPath: draft.receiptPath,
    notes: draft.notes.trim(),
  };
}

export async function addExpense(
  hid: string,
  draft: ExpenseDraft,
  createdBy: string,
): Promise<string> {
  const ref = await addDoc(expensesCol(hid), {
    ...materialise(draft),
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as unknown as Expense);
  return ref.id;
}

export async function updateExpense(
  hid: string,
  id: string,
  draft: ExpenseDraft,
): Promise<void> {
  await updateDoc(expenseDoc(hid, id), {
    ...materialise(draft),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteExpense(hid: string, id: string): Promise<void> {
  await deleteDoc(expenseDoc(hid, id));
}

/** Live expenses for a single month (sorted newest-first on the client). */
export function subscribeMonthExpenses(
  hid: string,
  key: string,
  cb: (expenses: Expense[]) => void,
  onError?: (e: Error) => void,
) {
  return onSnapshot(
    query(expensesCol(hid), where("month", "==", key)),
    (snap) => {
      const rows = snap.docs.map((d) => d.data());
      rows.sort((a, b) => b.date - a.date);
      cb(rows);
    },
    (err) => onError?.(err),
  );
}

/** Live expenses since a timestamp (for multi-month analytics). */
export function subscribeExpensesSince(
  hid: string,
  sinceMillis: number,
  cb: (expenses: Expense[]) => void,
  onError?: (e: Error) => void,
) {
  return onSnapshot(
    query(
      expensesCol(hid).withConverter(expenseConverter),
      where("date", ">=", sinceMillis),
      orderBy("date", "desc"),
    ),
    (snap) => cb(snap.docs.map((d) => d.data())),
    (err) => onError?.(err),
  );
}
