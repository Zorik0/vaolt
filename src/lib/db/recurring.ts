import {
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import type { RecurringExpense } from "../types";
import { monthKey } from "../format";
import { addExpense } from "./expenses";
import { recurringCol, recurringDoc } from "./converters";

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
 * current month yet. Runs client-side when the manager opens the app.
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

    await addExpense(
      hid,
      {
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
      },
      createdBy,
    );
    await updateDoc(recurringDoc(hid, r.id), { lastGenerated: key });
    created += 1;
  }
  return created;
}
