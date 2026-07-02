"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";
import { subscribeExpensesSince } from "@/lib/db/expenses";
import { subscribeSettlements } from "@/lib/db/settlements";
import { materialiseDueRecurring, subscribeRecurring } from "@/lib/db/recurring";
import { computeBalances, minimizeTransfers } from "@/lib/finance";
import { currentMonthKey, shiftMonth } from "@/lib/format";
import type {
  Expense,
  MemberBalance,
  RecurringExpense,
  Settlement,
  Transfer,
} from "@/lib/types";

/** How far back live data is loaded (months). Balances span this window. */
const WINDOW_MONTHS = 12;

interface DataContextValue {
  loading: boolean;
  month: string;
  setMonth: (key: string) => void;
  stepMonth: (delta: number) => void;
  canStepForward: boolean;
  canStepBack: boolean;
  windowExpenses: Expense[];
  monthExpenses: Expense[];
  settlements: Settlement[];
  recurring: RecurringExpense[];
  balances: MemberBalance[];
  transfers: Transfer[];
  myBalance: MemberBalance | null;
}

const DataContext = createContext<DataContextValue | null>(null);

function windowStart(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - (WINDOW_MONTHS - 1), 1).getTime();
}

export function HouseholdDataProvider({ children }: { children: React.ReactNode }) {
  const { household, uid, isManager, members } = useAuth();
  const toast = useToast();
  const hid = household?.id ?? null;

  const [windowExpenses, setWindowExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [month, setMonth] = useState<string>(currentMonthKey());
  const [expLoaded, setExpLoaded] = useState(false);
  const generatedRef = useRef(false);

  useEffect(() => {
    if (!hid) return;
    setExpLoaded(false);
    const since = windowStart();
    const unsub = subscribeExpensesSince(hid, since, (rows) => {
      setWindowExpenses(rows);
      setExpLoaded(true);
    });
    return unsub;
  }, [hid]);

  useEffect(() => {
    if (!hid) return;
    return subscribeSettlements(hid, setSettlements);
  }, [hid]);

  useEffect(() => {
    if (!hid) return;
    return subscribeRecurring(hid, setRecurring);
  }, [hid]);

  // Post any due recurring templates once per session (manager only).
  useEffect(() => {
    if (!hid || !uid || !isManager || generatedRef.current) return;
    if (recurring.length === 0) return;
    generatedRef.current = true;
    materialiseDueRecurring(hid, recurring, uid)
      .then((n) => {
        if (n > 0) toast.info(`Added ${n} recurring ${n === 1 ? "expense" : "expenses"} for this month.`);
      })
      .catch(() => {});
  }, [hid, uid, isManager, recurring, toast]);

  const memberIds = useMemo(() => members.map((m) => m.uid), [members]);

  const monthExpenses = useMemo(
    () => windowExpenses.filter((e) => e.month === month),
    [windowExpenses, month],
  );

  const balances = useMemo(
    () => computeBalances(memberIds, windowExpenses, settlements),
    [memberIds, windowExpenses, settlements],
  );

  const transfers = useMemo(() => minimizeTransfers(balances), [balances]);

  const myBalance = useMemo(
    () => balances.find((b) => b.uid === uid) ?? null,
    [balances, uid],
  );

  const minMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const value: DataContextValue = {
    loading: !expLoaded,
    month,
    setMonth,
    stepMonth: (delta: number) => setMonth((m) => shiftMonth(m, delta)),
    canStepForward: month < currentMonthKey(),
    canStepBack: shiftMonth(month, -1) >= shiftMonth(minMonth, -(WINDOW_MONTHS - 1)),
    windowExpenses,
    monthExpenses,
    settlements,
    recurring,
    balances,
    transfers,
    myBalance,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within HouseholdDataProvider");
  return ctx;
}
