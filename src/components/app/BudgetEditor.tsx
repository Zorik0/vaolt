"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { CategoryChip } from "@/components/ui/CategoryIcon";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { updateBudgets } from "@/lib/db/households";
import { CATEGORIES } from "@/lib/constants";
import { money } from "@/lib/format";
import type { BudgetMap } from "@/lib/types";

export function BudgetEditor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { household } = useAuth();
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !household) return;
    const init: Record<string, string> = {};
    for (const c of CATEGORIES) {
      const v = household.budgets[c.id] ?? 0;
      init[c.id] = v ? String(v) : "";
    }
    setValues(init);
  }, [open, household]);

  const total = useMemo(
    () => Object.values(values).reduce((s, v) => s + (parseFloat(v) || 0), 0),
    [values],
  );

  const save = async () => {
    if (!household) return;
    setSaving(true);
    try {
      const budgets: BudgetMap = {};
      for (const c of CATEGORIES) budgets[c.id] = parseFloat(values[c.id]) || 0;
      await updateBudgets(household.id, budgets);
      toast.success("Budgets updated.");
      onClose();
    } catch {
      toast.error("Couldn't update budgets.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Edit monthly budgets"
      description="Set how much you plan to spend in each category each month."
      footer={
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-sm">
            <span className="font-medium text-muted">Total monthly budget</span>
            <span className="text-lg font-semibold tabular-nums text-foreground">{money(total)}</span>
          </div>
          <Button className="w-full" size="lg" onClick={save} loading={saving}>
            Save budgets
          </Button>
        </div>
      }
    >
      <div className="space-y-2 pb-2">
        {CATEGORIES.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border p-2.5">
            <CategoryChip id={c.id} size="sm" />
            <label className="flex-1 text-sm font-medium text-foreground" htmlFor={`b-${c.id}`}>
              {c.label}
            </label>
            <div className="flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 focus-within:ring-1 focus-within:ring-brand">
              <span className="text-sm text-subtle">₹</span>
              <input
                id={`b-${c.id}`}
                inputMode="numeric"
                value={values[c.id] ?? ""}
                onChange={(e) =>
                  setValues((p) => ({ ...p, [c.id]: e.target.value.replace(/[^0-9]/g, "") }))
                }
                placeholder="0"
                className="w-24 bg-transparent py-2 text-right text-sm font-semibold tabular-nums text-foreground outline-none"
              />
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
