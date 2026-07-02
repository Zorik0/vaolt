"use client";

import { useEffect, useMemo, useState } from "react";
import { Paperclip, Plus, StickyNote, Trash2, X } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CategoryChip } from "@/components/ui/CategoryIcon";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { addExpense, updateExpense } from "@/lib/db/expenses";
import { deleteReceipt, uploadReceipt, validateReceipt } from "@/lib/db/storage";
import { resolveShares } from "@/lib/finance";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants";
import { money, toDateInputValue, fromDateInputValue } from "@/lib/format";
import { cn } from "@/lib/utils/cn";
import type { CategoryId, Expense, ExpenseDraft, SplitType } from "@/lib/types";

interface Prefill {
  categoryId?: CategoryId;
  amount?: number;
}

export function ExpenseForm({
  open,
  onClose,
  expense,
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  expense: Expense | null;
  prefill?: Prefill;
}) {
  const { household, members, uid } = useAuth();
  const toast = useToast();
  const hid = household?.id ?? "";

  const [amountStr, setAmountStr] = useState("");
  const [categoryId, setCategoryId] = useState<CategoryId>("groceries");
  const [description, setDescription] = useState("");
  const [paidBy, setPaidBy] = useState(uid ?? "");
  const [dateStr, setDateStr] = useState(toDateInputValue(Date.now()));
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [included, setIncluded] = useState<string[]>([]);
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadPct, setUploadPct] = useState(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const memberIds = useMemo(() => members.map((m) => m.uid), [members]);

  // Initialise whenever the sheet opens.
  useEffect(() => {
    if (!open) return;
    if (expense) {
      setAmountStr(String(expense.amount));
      setCategoryId(expense.categoryId);
      setDescription(expense.description);
      setPaidBy(expense.paidBy);
      setDateStr(toDateInputValue(expense.date));
      setSplitType(expense.splitType);
      setIncluded(expense.splitBetween.length ? expense.splitBetween : memberIds);
      setCustom(
        Object.fromEntries(Object.entries(expense.shares).map(([k, v]) => [k, String(v)])),
      );
      setNotes(expense.notes);
      setShowNotes(!!expense.notes);
      setReceiptUrl(expense.receiptUrl);
      setReceiptPath(expense.receiptPath);
    } else {
      setAmountStr("");
      setCategoryId(prefill?.categoryId ?? "groceries");
      setDescription("");
      setPaidBy(uid ?? memberIds[0] ?? "");
      setDateStr(toDateInputValue(Date.now()));
      setSplitType("equal");
      setIncluded(memberIds);
      setCustom({});
      setNotes("");
      setShowNotes(false);
      setReceiptUrl(null);
      setReceiptPath(null);
    }
    setFile(null);
    setUploadPct(0);
    setError("");
  }, [open, expense, prefill, uid, memberIds]);

  const amount = parseFloat(amountStr) || 0;

  const shares = useMemo(() => {
    if (splitType === "none") return { [paidBy]: amount };
    const inc = included.length ? included : memberIds;
    if (splitType === "custom") {
      const map: Record<string, number> = {};
      for (const id of inc) map[id] = parseFloat(custom[id] ?? "") || 0;
      return resolveShares(amount, "custom", inc, paidBy, map);
    }
    return resolveShares(amount, "equal", inc, paidBy);
  }, [splitType, included, custom, amount, paidBy, memberIds]);

  const customSum = useMemo(
    () => included.reduce((s, id) => s + (parseFloat(custom[id] ?? "") || 0), 0),
    [included, custom],
  );
  const customRemaining = amount - customSum;

  const toggleMember = (id: string) => {
    setIncluded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onPickFile = (f: File | null) => {
    if (!f) return;
    const err = validateReceipt(f);
    if (err) {
      toast.error(err);
      return;
    }
    setFile(f);
    setReceiptUrl(URL.createObjectURL(f));
  };

  const removeReceipt = () => {
    setFile(null);
    setReceiptUrl(null);
  };

  const validate = (): string | null => {
    if (amount <= 0) return "Enter an amount greater than zero.";
    if (splitType !== "none" && included.length === 0) return "Select at least one person to split with.";
    if (splitType === "custom" && Math.abs(customRemaining) > 0.5)
      return `Custom split must total ${money(amount)} (off by ${money(Math.abs(customRemaining))}).`;
    return null;
  };

  const submit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSaving(true);
    setError("");
    try {
      let finalUrl = receiptUrl;
      let finalPath = receiptPath;

      // Upload a freshly chosen file.
      if (file) {
        const res = await uploadReceipt(hid, file, setUploadPct);
        finalUrl = res.url;
        finalPath = res.path;
        if (expense?.receiptPath && expense.receiptPath !== res.path) {
          await deleteReceipt(expense.receiptPath);
        }
      } else if (expense?.receiptPath && !receiptUrl) {
        // Receipt was removed.
        await deleteReceipt(expense.receiptPath);
        finalPath = null;
      }

      const splitBetween = splitType === "none" ? [paidBy] : included;
      const draft: ExpenseDraft = {
        amount,
        categoryId,
        description: description.trim() || CATEGORY_MAP[categoryId].label,
        paidBy,
        splitType,
        splitBetween,
        shares,
        date: fromDateInputValue(dateStr),
        notes,
        receiptUrl: file ? finalUrl : receiptUrl,
        receiptPath: finalPath,
        isRecurring: expense?.isRecurring ?? false,
        recurringId: expense?.recurringId ?? null,
      };

      if (expense) {
        await updateExpense(hid, expense.id, draft);
        toast.success("Expense updated.");
      } else {
        await addExpense(hid, draft, uid ?? "");
        toast.success("Expense added.");
      }
      onClose();
    } catch (e) {
      console.error(e);
      setError("Couldn't save. Check your connection and try again.");
    } finally {
      setSaving(false);
      setUploadPct(0);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={expense ? "Edit expense" : "Add expense"}
      size="md"
      footer={
        <div className="space-y-2">
          {error && <p className="text-center text-xs font-medium text-negative">{error}</p>}
          <Button className="w-full" size="lg" onClick={submit} loading={saving}>
            {uploadPct > 0 && uploadPct < 1
              ? `Uploading ${Math.round(uploadPct * 100)}%`
              : expense
                ? "Save changes"
                : "Add expense"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pb-2">
        {/* Amount */}
        <div className="flex flex-col items-center pt-1">
          <label className="text-xs font-medium uppercase tracking-wide text-subtle">Amount</label>
          <div className="mt-1 flex items-center">
            <span className="text-3xl font-semibold text-subtle">₹</span>
            <input
              inputMode="decimal"
              autoFocus={!expense}
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              className="w-40 bg-transparent text-center text-5xl font-semibold tracking-tight text-foreground tabular-nums outline-none placeholder:text-border-strong"
            />
          </div>
        </div>

        {/* Category */}
        <Field label="Category">
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((c) => {
              const active = c.id === categoryId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all active:scale-95",
                    active ? "border-transparent bg-surface-2 ring-2 ring-brand" : "border-border hover:bg-surface-2",
                  )}
                >
                  <CategoryChip id={c.id} size="sm" />
                  <span className="w-full truncate text-center text-[0.7rem] font-medium text-muted">
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>

        {/* Description */}
        <Field label="Description">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`e.g. ${CATEGORY_MAP[categoryId].description}`}
          />
        </Field>

        {/* Paid by + date */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Paid by">
            <div className="flex flex-wrap gap-1.5">
              {members.map((m) => {
                const active = m.uid === paidBy;
                return (
                  <button
                    key={m.uid}
                    type="button"
                    onClick={() => setPaidBy(m.uid)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-xs font-medium transition-all active:scale-95",
                      active ? "border-transparent bg-brand/10 text-brand ring-1 ring-brand" : "border-border text-muted hover:bg-surface-2",
                    )}
                  >
                    <Avatar name={m.displayName} photoURL={m.photoURL} color={m.color} size="xs" />
                    {m.displayName.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Date">
            <Input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
          </Field>
        </div>

        {/* Split */}
        <Field label="Split">
          <SegmentedControl<SplitType>
            value={splitType}
            onChange={setSplitType}
            options={[
              { value: "equal", label: "Equally" },
              { value: "custom", label: "Custom" },
              { value: "none", label: "Don't split" },
            ]}
          />
          {splitType !== "none" && (
            <div className="mt-3 space-y-1.5">
              {members.map((m) => {
                const inc = included.includes(m.uid);
                return (
                  <div
                    key={m.uid}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors",
                      inc ? "border-border bg-surface-2" : "border-border opacity-50",
                    )}
                  >
                    <button type="button" onClick={() => toggleMember(m.uid)} className="flex flex-1 items-center gap-2.5">
                      <Avatar name={m.displayName} photoURL={m.photoURL} color={m.color} size="sm" />
                      <span className="text-sm font-medium text-foreground">{m.displayName.split(" ")[0]}</span>
                    </button>
                    {splitType === "custom" && inc ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-subtle">₹</span>
                        <input
                          inputMode="decimal"
                          value={custom[m.uid] ?? ""}
                          onChange={(e) =>
                            setCustom((p) => ({ ...p, [m.uid]: e.target.value.replace(/[^0-9.]/g, "") }))
                          }
                          placeholder="0"
                          className="w-20 rounded-lg bg-surface px-2 py-1 text-right text-sm tabular-nums outline-none ring-1 ring-border focus:ring-brand"
                        />
                      </div>
                    ) : (
                      <span className={cn("text-sm font-semibold tabular-nums", inc ? "text-foreground" : "text-subtle")}>
                        {inc ? money(shares[m.uid] ?? 0, { decimals: true }) : "—"}
                      </span>
                    )}
                  </div>
                );
              })}
              {splitType === "custom" && (
                <div className="flex justify-between px-1 pt-1 text-xs font-medium">
                  <span className="text-subtle">Total {money(customSum, { decimals: true })}</span>
                  <span className={cn(Math.abs(customRemaining) > 0.5 ? "text-negative" : "text-positive")}>
                    {Math.abs(customRemaining) <= 0.5 ? "Balanced" : `${money(customRemaining, { decimals: true, signed: true })} left`}
                  </span>
                </div>
              )}
            </div>
          )}
        </Field>

        {/* Receipt + notes */}
        <div className="flex flex-wrap gap-2">
          {!receiptUrl && (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border-strong px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2">
              <Paperclip className="size-4" />
              Attach receipt
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
          {!showNotes && (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border-strong px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2"
            >
              <StickyNote className="size-4" />
              Add note
            </button>
          )}
        </div>

        {receiptUrl && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-2.5">
            <div className="grid size-10 place-items-center overflow-hidden rounded-lg bg-surface">
              {receiptUrl.startsWith("blob:") || /\.(png|jpe?g|webp)|image/i.test(receiptUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={receiptUrl} alt="Receipt" className="size-full object-cover" />
              ) : (
                <Paperclip className="size-4 text-muted" />
              )}
            </div>
            <span className="flex-1 truncate text-sm text-muted">{file?.name ?? "Receipt attached"}</span>
            <button type="button" onClick={removeReceipt} className="rounded-lg p-1.5 text-subtle hover:text-negative">
              <X className="size-4" />
            </button>
          </div>
        )}

        {showNotes && (
          <Field label="Note">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any context…" />
          </Field>
        )}
      </div>
    </Sheet>
  );
}

/* Small helper icons re-exported for callers that build their own triggers. */
export const ExpenseFormIcons = { Plus, Trash2 };
