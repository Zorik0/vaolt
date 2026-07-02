"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CategoryChip } from "@/components/ui/CategoryIcon";
import { Avatar } from "@/components/ui/Avatar";
import { Switch } from "@/components/ui/Switch";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { addRecurring, updateRecurring } from "@/lib/db/recurring";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import type { CategoryId, RecurringExpense, SplitType } from "@/lib/types";

export function RecurringForm({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: RecurringExpense | null;
}) {
  const { household, members, uid } = useAuth();
  const toast = useToast();

  const [amountStr, setAmountStr] = useState("");
  const [categoryId, setCategoryId] = useState<CategoryId>("rent");
  const [description, setDescription] = useState("");
  const [paidBy, setPaidBy] = useState(uid ?? "");
  const [day, setDay] = useState("1");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [included, setIncluded] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const memberIds = members.map((m) => m.uid);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setAmountStr(String(editing.amount));
      setCategoryId(editing.categoryId);
      setDescription(editing.description);
      setPaidBy(editing.paidBy);
      setDay(String(editing.dayOfMonth));
      setSplitType(editing.splitType === "none" ? "none" : "equal");
      setIncluded(editing.splitBetween.length ? editing.splitBetween : memberIds);
      setActive(editing.active);
    } else {
      setAmountStr("");
      setCategoryId("rent");
      setDescription("");
      setPaidBy(uid ?? memberIds[0] ?? "");
      setDay("1");
      setSplitType("equal");
      setIncluded(memberIds);
      setActive(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const amount = parseFloat(amountStr) || 0;

  const save = async () => {
    if (!household || amount <= 0) return;
    setSaving(true);
    try {
      const splitBetween = splitType === "none" ? [paidBy] : included.length ? included : memberIds;
      const draft = {
        amount,
        categoryId,
        description: description.trim() || CATEGORY_MAP[categoryId].label,
        paidBy,
        splitType,
        splitBetween,
        dayOfMonth: Math.min(28, Math.max(1, parseInt(day) || 1)),
        active,
      };
      if (editing) {
        await updateRecurring(household.id, editing.id, draft);
        toast.success("Recurring expense updated.");
      } else {
        await addRecurring(household.id, draft, uid ?? "");
        toast.success("Recurring expense added.");
      }
      onClose();
    } catch {
      toast.error("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Edit recurring expense" : "New recurring expense"}
      description="Automatically added on the chosen day each month."
      footer={
        <Button className="w-full" size="lg" onClick={save} loading={saving} disabled={amount <= 0}>
          {editing ? "Save changes" : "Add recurring expense"}
        </Button>
      }
    >
      <div className="space-y-5 pb-2">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₹)">
            <Input
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              className="tabular-nums"
            />
          </Field>
          <Field label="Day of month" hint="1–28">
            <Input
              inputMode="numeric"
              value={day}
              onChange={(e) => setDay(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="1"
            />
          </Field>
        </div>

        <Field label="Category">
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all active:scale-95",
                  c.id === categoryId ? "border-transparent bg-surface-2 ring-2 ring-brand" : "border-border hover:bg-surface-2",
                )}
              >
                <CategoryChip id={c.id} size="sm" />
                <span className="w-full truncate text-center text-[0.7rem] font-medium text-muted">{c.label}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Description">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={CATEGORY_MAP[categoryId].label} />
        </Field>

        <Field label="Paid by">
          <Select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {members.map((m) => (
              <option key={m.uid} value={m.uid}>
                {m.displayName}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Split">
          <SegmentedControl<SplitType>
            value={splitType}
            onChange={setSplitType}
            options={[
              { value: "equal", label: "Split equally" },
              { value: "none", label: "Don't split" },
            ]}
          />
          {splitType === "equal" && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {members.map((m) => {
                const inc = included.includes(m.uid);
                return (
                  <button
                    key={m.uid}
                    type="button"
                    onClick={() =>
                      setIncluded((p) => (p.includes(m.uid) ? p.filter((x) => x !== m.uid) : [...p, m.uid]))
                    }
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-xs font-medium transition-all active:scale-95",
                      inc ? "border-transparent bg-brand/10 text-brand ring-1 ring-brand" : "border-border text-muted opacity-70",
                    )}
                  >
                    <Avatar name={m.displayName} photoURL={m.photoURL} color={m.color} size="xs" />
                    {m.displayName.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          )}
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
          <div>
            <p className="text-sm font-medium text-foreground">Active</p>
            <p className="text-xs text-muted">Pause to stop auto-adding this expense.</p>
          </div>
          <Switch checked={active} onChange={setActive} />
        </div>
      </div>
    </Sheet>
  );
}
