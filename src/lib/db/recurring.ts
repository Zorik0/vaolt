import {
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import type { Expense, RecurringExpense } from "../types";
import { db } from "../firebase/config";
import { monthKey } from "../format";
import { materialiseExpense } from "./expenses";
import { expensesCol, recurringCol, recurringDoc } from "./converters";

export type RecurringDraft = Omit<
  RecurringExpense,
  "id" | "createdAt" | "lastGenerated" | "createdBy"
>;

export async function addRecurring(
  hid: string,
  draft: RecurringDraft,
  createdBy: string,
): Promise<string> {
  const ref = await addDoc(recurringCol(hid), {
    ...draft,
    lastGenerated: null,
    createdBy,
    createdAt: serverTimestamp(),
  } as unknown as RecurringExpense);
  return ref.id;
}

export async function updateRecurring(
  hid: string,
  id: string,
  patch: Partial<RecurringDraft>,
): Promise<void> {
  await updateDoc(recurringDoc(hid, id), patch);
}

export async function deleteRecurring(hid: string, id: string): Promise<void> {
  await deleteDoc(recurringDoc(hid, id));
}

export function subscribeRecurring(
  hid: string,
  cb: (rows: RecurringExpense[]) => void,
  onError?: (e: Error) => void,
) {
  return onSnapshot(
    query(recurringCol(hid)),
    (snap) => cb(snap.docs.map((d) => d.data())),
    (err) => onError?.(err),
  );
}

/**
 * Post any active recurring templates that haven't been generated for the
 * current month yet. Runs client-side when any member opens the app; each
 * template is posted inside a transaction that re-checks `lastGenerated`,
 * so concurrent sessions can't double-post the same bill.
 * Returns the number of expenses created.
 */
export async function materialiseDueRecurring(
  hid: string,
  rows: RecurringExpense[],
  createdBy: string,
): Promise<number> {
  const now = new Date();
  const key = monthKey(now);
  let created = 0;

  for (const r of rows) {
    if (!r.active) continue;
    if (r.lastGenerated === key) continue;
    // Only generate once the scheduled day has arrived.
    if (now.getDate() < r.dayOfMonth) continue;

    const day = Math.min(r.dayOfMonth, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
    const date = new Date(now.getFullYear(), now.getMonth(), day, 12).getTime();

    const posted = await runTransaction(db, async (tx) => {
      const snap = await tx.get(recurringDoc(hid, r.id));
      const current = snap.data();
      if (!current || !current.active || current.lastGenerated === key) return false;

      tx.set(doc(expensesCol(hid)), {
        ...materialiseExpense({
          amount: r.amount,
          categoryId: r.categoryId,
          description: r.description,
          paidBy: r.paidBy,
          splitType: r.splitType,
          splitBetween: r.splitBetween,
          shares: {},
          date,
          notes: "Auto-generated recurring expense",
          receiptUrl: null,
          receiptPath: null,
          isRecurring: true,
          recurringId: r.id,
        }),
        createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as unknown as Expense);
      tx.update(recurringDoc(hid, r.id), { lastGenerated: key });
      return true;
    }).catch(() => false);

    if (posted) created += 1;
  }
  return created;
}
