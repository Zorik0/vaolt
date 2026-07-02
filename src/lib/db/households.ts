import {
  arrayRemove,
  arrayUnion,
  deleteField,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { AppUser, BudgetMap, Household, HouseholdMember } from "../types";
import { DEFAULT_BUDGETS, MEMBER_COLORS } from "../constants";
import { householdDoc, householdsCol, userDoc } from "./converters";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
const MAX_MEMBERS = 6;

export function generateInviteCode(len = 6): string {
  let out = "";
  for (let i = 0; i < len; i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

function makeMember(user: AppUser, role: HouseholdMember["role"], index: number): HouseholdMember {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL ?? null,
    role,
    color: MEMBER_COLORS[index % MEMBER_COLORS.length],
  };
}

/** Create a new household with the current user as manager. Returns the id. */
export async function createHousehold(user: AppUser, name: string): Promise<string> {
  const ref = doc(householdsCol());
  const hid = ref.id;
  const manager = makeMember(user, "manager", 0);

  await runTransaction(db, async (tx) => {
    tx.set(ref, {
      id: hid,
      name: name.trim() || "Our Home",
      managerId: user.uid,
      memberIds: [user.uid],
      members: { [user.uid]: manager },
      budgets: { ...DEFAULT_BUDGETS },
      currency: "INR",
      inviteCode: generateInviteCode(),
      createdAt: serverTimestamp(),
    } as unknown as Household);
    tx.update(userDoc(user.uid), { householdId: hid, role: "manager" });
  });

  return hid;
}

/** Join an existing household by its invite code. Returns the household id. */
export async function joinHousehold(user: AppUser, code: string): Promise<string> {
  const cleaned = code.trim().toUpperCase();
  const snap = await getDocs(
    query(householdsCol(), where("inviteCode", "==", cleaned), limit(1)),
  );
  if (snap.empty) throw new Error("That invite code doesn't match any household.");

  const household = snap.docs[0].data();
  const hid = household.id;

  await runTransaction(db, async (tx) => {
    const fresh = await tx.get(householdDoc(hid));
    const data = fresh.data();
    if (!data) throw new Error("Household no longer exists.");
    if (data.memberIds.includes(user.uid)) {
      tx.update(userDoc(user.uid), { householdId: hid, role: "member" });
      return;
    }
    if (data.memberIds.length >= MAX_MEMBERS) {
      throw new Error("This household is full.");
    }
    const member = makeMember(user, "member", data.memberIds.length);
    tx.update(householdDoc(hid), {
      memberIds: arrayUnion(user.uid),
      [`members.${user.uid}`]: member,
    });
    tx.update(userDoc(user.uid), { householdId: hid, role: "member" });
  });

  return hid;
}

export function subscribeHousehold(
  hid: string,
  cb: (h: Household | null) => void,
  onError?: (e: Error) => void,
) {
  return onSnapshot(
    householdDoc(hid),
    (snap) => cb(snap.exists() ? snap.data() : null),
    (err) => onError?.(err),
  );
}

export async function updateBudgets(hid: string, budgets: BudgetMap): Promise<void> {
  await updateDoc(householdDoc(hid), { budgets });
}

export async function updateHouseholdName(hid: string, name: string): Promise<void> {
  await updateDoc(householdDoc(hid), { name: name.trim() || "Our Home" });
}

export async function regenerateInviteCode(hid: string): Promise<string> {
  const code = generateInviteCode();
  await updateDoc(householdDoc(hid), { inviteCode: code });
  return code;
}

/** Manager removes a member; their profile is detached on next app load. */
export async function removeMember(hid: string, uid: string): Promise<void> {
  await updateDoc(householdDoc(hid), {
    memberIds: arrayRemove(uid),
    [`members.${uid}`]: deleteField(),
  });
}

/** Keep the denormalised member profile in sync with the user's own edits. */
export async function syncMemberProfile(
  hid: string,
  uid: string,
  patch: Partial<Pick<HouseholdMember, "displayName" | "photoURL">>,
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (patch.displayName !== undefined) updates[`members.${uid}.displayName`] = patch.displayName;
  if (patch.photoURL !== undefined) updates[`members.${uid}.photoURL`] = patch.photoURL;
  if (Object.keys(updates).length) await setDoc(householdDoc(hid), updates, { merge: true });
}
