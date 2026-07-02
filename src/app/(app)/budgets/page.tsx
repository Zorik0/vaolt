"use client";

import { useMemo, useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { MonthNav } from "@/components/app/MonthNav";
import { BudgetEditor } from "@/components/app/BudgetEditor";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Amount } from "@/components/ui/Amount";
import { ProgressBar, ProgressRing } from "@/components/ui/Progress";
import { CategoryChip } from "@/components/ui/CategoryIcon";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/HouseholdDataProvider";
import { useExpenseForm } from "@/components/providers/ExpenseFormProvider";
import { computeBudgetStatus, sumExpenses, totalBudget } from "@/lib/finance";
import { CATEGORY_MAP } from "@/lib/constants";
import { money, percent } from "@/lib/format";

export default function BudgetsPage() {
  const { household, isManager } = useAuth();
  const { monthExpenses } = useData();
  const { openNew } = useExpenseForm();
  const [editorOpen, setEditorOpen] = useState(false);

  const budgets = household?.budgets ?? {};
  const budget = totalBudget(budgets);
  const spent = sumExpenses(monthExpenses);
  const remaining = budget - spent;
  const ratio = budget > 0 ? spent / budget : 0;

  const status = useMemo(
    () =>
      computeBudgetStatus(monthExpenses, budgets)
        .filter((b) => b.budget > 0 || b.spent > 0)
        .sort((a, b) => b.budget - a.budget || b.spent - a.spent),
    [monthExpenses, budgets],
  );

  return (
    <>
      <PageHeader
        title="Budgets"
        subtitle="Spending against your monthly plan"
        action={<MonthNav />}
      />

      {/* Overview */}
      <Card className="mb-5 p-5 sm:p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <ProgressRing ratio={ratio} size={132} stroke={12}>
            <div className="text-center">
              <div className="text-xl font-semibold tracking-tight text-foreground">
                {budget > 0 ? percent(Math.min(ratio, 9.99)) : "—"}
              </div>
              <div className="text-[0.7rem] font-medium text-subtle">used</div>
            </div>
          </ProgressRing>
          <div className="grid w-full flex-1 grid-cols-3 gap-3 text-center sm:text-left">
            <Stat label="Budget" value={money(budget)} />
            <Stat label="Spent" value={money(spent)} />
            <Stat
              label={remaining < 0 ? "Over" : "Remaining"}
              value={money(Math.abs(remaining))}
              tone={remaining < 0 ? "negative" : "positive"}
            />
          </div>
        </div>
      </Card>

      {isManager && (
        <div className="mb-4 flex justify-end">
          <Button variant="secondary" size="sm" icon={<SlidersHorizontal className="size-4" />} onClick={() => setEditorOpen(true)}>
            Edit budgets
          </Button>
        </div>
      )}

      {/* Category cards */}
      <div className="space-y-3">
        {status.map((b) => {
          const meta = CATEGORY_MAP[b.categoryId];
          const over = b.remaining < 0;
          const noBudget = b.budget === 0;
          return (
            <Card
              key={b.categoryId}
              interactive={isManager}
              onClick={isManager ? () => openNew({ categoryId: b.categoryId }) : undefined}
              className="p-4"
            >
              <div className="flex items-center gap-3">
                <CategoryChip id={b.categoryId} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{meta.label}</span>
                    {noBudget ? (
                      <Badge tone="neutral">No budget</Badge>
                    ) : over ? (
                      <Badge tone="negative">Over</Badge>
                    ) : b.ratio >= 0.85 ? (
                      <Badge tone="warning">{percent(b.ratio)}</Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted">
                    {b.count} {b.count === 1 ? "expense" : "expenses"}
                  </p>
                </div>
                <div className="text-right">
                  <Amount value={b.spent} className="font-semibold text-foreground" />
                  {!noBudget && <p className="text-xs text-subtle">of {money(b.budget)}</p>}
                </div>
              </div>
              {!noBudget && (
                <div className="mt-3">
                  <ProgressBar ratio={b.ratio} color={meta.color} height={7} />
                  <div className="mt-1.5 flex justify-between text-xs">
                    <span className="text-subtle">{percent(b.ratio)} used</span>
                    <span className={over ? "font-medium text-negative" : "text-muted"}>
                      {over ? `${money(-b.remaining)} over` : `${money(b.remaining)} left`}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <BudgetEditor open={editorOpen} onClose={() => setEditorOpen(false)} />
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "negative" | "positive";
}) {
  return (
    <div>
      <p className="text-xs font-medium text-subtle">{label}</p>
      <p
        className={
          "mt-0.5 text-lg font-semibold tabular-nums " +
          (tone === "negative" ? "text-negative" : tone === "positive" ? "text-positive" : "text-foreground")
        }
      >
        {value}
      </p>
    </div>
  );
}
