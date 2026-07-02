"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ExpenseForm } from "@/components/app/ExpenseForm";
import type { CategoryId, Expense } from "@/lib/types";

interface Prefill {
  categoryId?: CategoryId;
  amount?: number;
}

interface ExpenseFormContextValue {
  openNew: (prefill?: Prefill) => void;
  openEdit: (expense: Expense) => void;
}

const Ctx = createContext<ExpenseFormContextValue | null>(null);

export function ExpenseFormProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [prefill, setPrefill] = useState<Prefill | undefined>();

  const openNew = useCallback((p?: Prefill) => {
    setExpense(null);
    setPrefill(p);
    setOpen(true);
  }, []);

  const openEdit = useCallback((e: Expense) => {
    setPrefill(undefined);
    setExpense(e);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openNew, openEdit }), [openNew, openEdit]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <ExpenseForm open={open} onClose={() => setOpen(false)} expense={expense} prefill={prefill} />
    </Ctx.Provider>
  );
}

export function useExpenseForm(): ExpenseFormContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useExpenseForm must be used within ExpenseFormProvider");
  return ctx;
}
