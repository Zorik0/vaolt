import {
  collection,
  doc,
  type CollectionReference,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { Expense, Household, RecurringExpense, Settlement } from "../types";

/** Generic converter that injects the document id and strips it on write. */
function withId<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(model) {
      const { id: _omit, ...rest } = model as T & { id: string };
      void _omit;
      return rest as DocumentData;
    },
    fromFirestore(snap: QueryDocumentSnapshot) {
      return { id: snap.id, ...snap.data() } as T;
    },
  };
}

export const householdConverter = withId<Household>();
export const expenseConverter = withId<Expense>();
export const settlementConverter = withId<Settlement>();
export const recurringConverter = withId<RecurringExpense>();

/* -------------------------- collection helpers ------------------------- */

export const usersCol = () => collection(db, "users");
export const userDoc = (uid: string) => doc(db, "users", uid);

export const householdsCol = () =>
  collection(db, "households").withConverter(householdConverter);
export const householdDoc = (hid: string) =>
  doc(db, "households", hid).withConverter(householdConverter);

export const expensesCol = (hid: string) =>
  collection(db, "households", hid, "expenses").withConverter(
    expenseConverter,
  ) as CollectionReference<Expense>;
export const expenseDoc = (hid: string, id: string) =>
  doc(db, "households", hid, "expenses", id).withConverter(expenseConverter);

export const settlementsCol = (hid: string) =>
  collection(db, "households", hid, "settlements").withConverter(
    settlementConverter,
  ) as CollectionReference<Settlement>;
export const settlementDoc = (hid: string, id: string) =>
  doc(db, "households", hid, "settlements", id).withConverter(settlementConverter);

export const recurringCol = (hid: string) =>
  collection(db, "households", hid, "recurring").withConverter(
    recurringConverter,
  ) as CollectionReference<RecurringExpense>;
export const recurringDoc = (hid: string, id: string) =>
  doc(db, "households", hid, "recurring", id).withConverter(recurringConverter);
