"use client";

import { Paperclip, Repeat } from "lucide-react";
import { CategoryChip } from "@/components/ui/CategoryIcon";
import { Amount } from "@/components/ui/Amount";
import { useAuth } from "@/components/providers/AuthProvider";
import { relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils/cn";
import type { Expense } from "@/lib/types";

export function ExpenseRow({
  expense,
  onClick,
  showDate = true,
}: {
  expense: Expense;
  onClick?: () => void;
  showDate?: boolean;
}) {
  const { household } = useAuth();
  const payer = household?.members[expense.paidBy];
  const payerName = payer ? payer.displayName.split(" ")[0] : "Someone";

  const splitLabel =
    expense.splitType === "none"
      ? "Not split"
      : expense.splitBetween.length <= 1
        ? "Personal"
        : `Split ${expense.splitBetween.length} ways`;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors",
        onClick && "hover:bg-surface-2 active:bg-surface-3",
      )}
    >
      <CategoryChip id={expense.categoryId} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[0.95rem] font-semibold text-foreground">{expense.description}</p>
          {expense.isRecurring && <Repeat className="size-3.5 shrink-0 text-subtle" />}
          {expense.receiptUrl && <Paperclip className="size-3.5 shrink-0 text-subtle" />}
        </div>
        <p className="truncate text-xs text-muted">
          {payerName} paid{showDate ? ` · ${relativeDay(expense.date)}` : ""} · {splitLabel}
        </p>
      </div>
      <Amount value={expense.amount} className="shrink-0 text-[0.95rem] font-semibold text-foreground" />
    </button>
  );
}
