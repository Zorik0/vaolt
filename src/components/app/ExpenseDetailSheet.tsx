"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { CalendarDays, ExternalLink, Pencil, Trash2, User } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Amount } from "@/components/ui/Amount";
import { Badge } from "@/components/ui/Badge";
import { CategoryChip } from "@/components/ui/CategoryIcon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { useExpenseForm } from "@/components/providers/ExpenseFormProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { deleteExpense } from "@/lib/db/expenses";
import { CATEGORY_MAP } from "@/lib/constants";
import { formatDate, money } from "@/lib/format";
import type { Expense } from "@/lib/types";

const SPLIT_LABEL = { equal: "Split equally", custom: "Custom split", none: "Not split" } as const;

export function ExpenseDetailSheet({
  expense,
  open,
  onClose,
}: {
  expense: Expense | null;
  open: boolean;
  onClose: () => void;
}) {
  const { household } = useAuth();
  const { openEdit } = useExpenseForm();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!expense) return null;
  const payer = household?.members[expense.paidBy];
  const isImage = expense.receiptUrl && /\.(png|jpe?g|webp|heic)(\?|$)/i.test(expense.receiptUrl);

  const shareRows = Object.entries(expense.shares).filter(([, v]) => v > 0);

  const handleDelete = async () => {
    if (!household) return;
    await deleteExpense(household.id, expense.id);
    toast.success("Expense deleted.");
    onClose();
  };

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title="Expense"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              icon={<Pencil className="size-4" />}
              onClick={() => {
                onClose();
                openEdit(expense);
              }}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              icon={<Trash2 className="size-4" />}
              onClick={() => setConfirmOpen(true)}
            >
              Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-5 pb-2">
          <div className="flex flex-col items-center gap-3 pt-1 text-center">
            <CategoryChip id={expense.categoryId} size="lg" />
            <div>
              <Amount value={expense.amount} className="text-3xl font-semibold tracking-tight text-foreground" />
              <p className="mt-1 text-sm font-medium text-foreground">{expense.description}</p>
            </div>
            <Badge tone="neutral">{CATEGORY_MAP[expense.categoryId].label}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Meta icon={<User className="size-4" />} label="Paid by">
              <div className="flex items-center gap-2">
                {payer && <Avatar name={payer.displayName} photoURL={payer.photoURL} color={payer.color} size="xs" />}
                <span className="truncate text-sm font-medium text-foreground">
                  {payer?.displayName ?? "Unknown"}
                </span>
              </div>
            </Meta>
            <Meta icon={<CalendarDays className="size-4" />} label="Date">
              <span className="text-sm font-medium text-foreground">{formatDate(expense.date)}</span>
            </Meta>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
                {SPLIT_LABEL[expense.splitType]}
              </span>
            </div>
            <div className="space-y-1 rounded-2xl border border-border bg-surface-2 p-2">
              {shareRows.length === 0 && (
                <p className="px-2 py-1.5 text-sm text-muted">This expense isn&apos;t split with anyone.</p>
              )}
              {shareRows.map(([uid, amt]) => {
                const m = household?.members[uid];
                return (
                  <div key={uid} className="flex items-center justify-between px-2 py-1.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={m?.displayName ?? "?"}
                        photoURL={m?.photoURL}
                        color={m?.color}
                        size="sm"
                      />
                      <span className="text-sm font-medium text-foreground">
                        {m?.displayName ?? "Unknown"}
                      </span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {money(amt, { decimals: true })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {expense.notes && (
            <div className="rounded-2xl border border-border bg-surface-2 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Note</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">{expense.notes}</p>
            </div>
          )}

          {expense.receiptUrl && (
            <a
              href={expense.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-2xl border border-border"
            >
              {isImage ? (
                <img src={expense.receiptUrl} alt="Receipt" className="max-h-72 w-full object-cover" />
              ) : (
                <div className="flex items-center justify-between p-4 text-sm font-medium text-foreground">
                  View receipt
                  <ExternalLink className="size-4 text-muted" />
                </div>
              )}
            </a>
          )}
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete expense?"
        message={`This will permanently remove "${expense.description}" (${money(expense.amount)}) and update everyone's balances.`}
        confirmLabel="Delete"
        danger
      />
    </>
  );
}

function Meta({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-subtle">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}
