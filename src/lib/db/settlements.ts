import {
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Settlement } from "../types";
import { settlementDoc, settlementsCol } from "./converters";

export interface NewSettlement {
  fromUid: string;
  toUid: string;
  amount: number;
  method: string;
  note?: string;
  month: string;
  status?: Settlement["status"];
}

export async function addSettlement(
  hid: string,
  data: NewSettlement,
  createdBy: string,
): Promise<string> {
  const status = data.status ?? "completed";
  const ref = await addDoc(settlementsCol(hid), {
    fromUid: data.fromUid,
    toUid: data.toUid,
    amount: data.amount,
    method: data.method,
    note: data.note?.trim() ?? "",
    month: data.month,
    status,
    createdBy,
    createdAt: serverTimestamp(),
    completedAt: status === "completed" ? serverTimestamp() : null,
  } as unknown as Settlement);
  return ref.id;
}

export async function completeSettlement(hid: string, id: string): Promise<void> {
  await updateDoc(settlementDoc(hid, id), {
    status: "completed",
    completedAt: serverTimestamp(),
  });
}

export async function deleteSettlement(hid: string, id: string): Promise<void> {
  await deleteDoc(settlementDoc(hid, id));
}

/** All settlements for a household (small volume — sorted on the client). */
export function subscribeSettlements(
  hid: string,
  cb: (rows: Settlement[]) => void,
  onError?: (e: Error) => void,
) {
  return onSnapshot(
    query(settlementsCol(hid)),
    (snap) => {
      const rows = snap.docs.map((d) => d.data());
      rows.sort((a, b) => {
        const at = a.createdAt?.toMillis?.() ?? 0;
        const bt = b.createdAt?.toMillis?.() ?? 0;
        return bt - at;
      });
      cb(rows);
    },
    (err) => onError?.(err),
  );
}

/** Settlements filtered to a month (client-side). */
export function filterSettlementsByMonth(rows: Settlement[], key: string): Settlement[] {
  return rows.filter((s) => s.month === key);
}
