"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Plus, Wallet } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { MonthNav } from "@/components/app/MonthNav";
import { StatTile } from "@/components/app/StatTile";
import { ExpenseRow } from "@/components/app/ExpenseRow";
import { ExpenseDetailSheet } from "@/components/app/ExpenseDetailSheet";
import { Card, SectionTitle } from "@/components/ui/Card";
import { ProgressRing, ProgressBar } from "@/components/ui/Progress";
import { Amount } from "@/components/ui/Amount";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CategoryChip } from "@/components/ui/CategoryIcon";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/HouseholdDataProvider";
import { useExpenseForm } from "@/components/providers/ExpenseFormProvider";
import { computeBudgetStatus, sumExpenses, totalBudget } from "@/lib/finance";
import { CATEGORY_MAP } from "@/lib/constants";
import { money, percent } from "@/lib/format";
import type { Expense } from "@/lib/types";

export default function DashboardPage() {
  const { appUser, household, isManager, members } = useAuth();
  const { monthExpenses, myBalance, transfers, loading } = useData();
  const { openNew } = useExpenseForm();
  const [selected, setSelected] = useState<Expense | null>(null);

  const budgets = household?.budgets ?? {};
  const budget = totalBudget(budgets);
  const spent = sumExpenses(monthExpenses);
  const remaining = budget - spent;
  const ratio = budget > 0 ? spent / budget : 0;

  const myShare = useMemo(
    () => monthExpenses.reduce((s, e) => s + (e.shares[appUser?.uid ?? ""] ?? 0), 0),
    [monthExpenses, appUser?.uid],
  );

  const budgetStatus = useMemo(
    () => computeBudgetStatus(monthExpenses, budgets).filter((b) => b.budget > 0 || b.spent > 0),
    [monthExpenses, budgets],
  );
  const topCategories = useMemo(
    () => [...budgetStatus].sort((a, b) => b.spent - a.spent).slice(0, 4),
    [budgetStatus],
  );

  const recent = monthExpenses.slice(0, 5);

  const net = myBalance?.net ?? 0;
  const owed = net > 0.5;
  const owes = net < -0.5;

  const myTransfers = transfers.filter((t) => t.fromUid === appUser?.uid || t.toUid === appUser?.uid);

  return (
    <>
      <PageHeader
        title={appUser?.displayName.split(" ")[0] ?? "Home"}
        subtitle={household?.name}
        action={<MonthNav />}
      />

      <div className="space-y-6 stagger">
        {/* Budget hero */}
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
            <ProgressRing ratio={ratio} size={148} stroke={13}>
              <div className="text-center">
                <div className="text-2xl font-semibold tracking-tight text-foreground">
                  {budget > 0 ? percent(Math.min(ratio, 9.99)) : "—"}
                </div>
                <div className="text-xs font-medium text-subtle">of budget</div>
              </div>
            </ProgressRing>

            <div className="flex-1 space-y-4 self-stretch">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs font-medium text-subtle">Spent this month</p>
                  {loading ? (
                    <Skeleton className="mt-1 h-8 w-32" />
                  ) : (
                    <Amount value={spent} className="text-3xl font-semibold tracking-tight text-foreground" />
                  )}
                </div>
                {ratio > 1 ? (
                  <Badge tone="negative">Over budget</Badge>
                ) : ratio >= 0.85 ? (
                  <Badge tone="warning">Almost there</Badge>
                ) : (
                  <Badge tone="positive">On track</Badge>
                )}
              </div>
              <ProgressBar ratio={ratio} height={10} />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  Budget <span className="font-semibold text-foreground">{money(budget)}</span>
                </span>
                <span className={remaining < 0 ? "text-negative" : "text-muted"}>
                  {remaining < 0 ? "Over by " : "Left "}
                  <span className="font-semibold">{money(Math.abs(remaining))}</span>
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label="Your share"
            value={<Amount value={myShare} />}
            sub="This month"
          />
          <Link href="/balances" className="contents">
            <StatTile
              label="Your balance"
              value={<Amount value={net} colorize absolute />}
              sub={owed ? "You're owed" : owes ? "You owe" : "All settled"}
              icon={<ArrowUpRight className="size-4" />}
            />
          </Link>
        </div>

        {/* Settle-up nudge */}
        {(owed || owes) && myTransfers.length > 0 && (
          <Card className="flex items-center gap-4 border-brand/20 bg-brand/[0.06] p-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
              <Wallet className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {owes ? "Time to settle up" : "You're owed money"}
              </p>
              <p className="truncate text-xs text-muted">
                {myTransfers.length} suggested {myTransfers.length === 1 ? "transfer" : "transfers"} to clear balances
              </p>
            </div>
            <Link href="/balances">
              <Button size="sm" variant="secondary" icon={<ArrowRight className="size-4" />}>
                Settle
              </Button>
            </Link>
          </Card>
        )}

        {/* Budgets snapshot */}
        <div>
          <SectionTitle action={<Link href="/budgets" className="text-xs font-semibold text-brand">View all</Link>}>
            Budgets
          </SectionTitle>
          <Card className="divide-y divide-border p-2">
            {topCategories.length === 0 ? (
              <p className="p-4 text-sm text-muted">No budgets set for this month.</p>
            ) : (
              topCategories.map((b) => (
                <div key={b.categoryId} className="flex items-center gap-3 p-2.5">
                  <CategoryChip id={b.categoryId} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {CATEGORY_MAP[b.categoryId].label}
                      </span>
                      <span className="text-xs font-medium tabular-nums text-muted">
                        {money(b.spent)}{b.budget > 0 && <span className="text-subtle"> / {money(b.budget)}</span>}
                      </span>
                    </div>
                    <ProgressBar ratio={b.ratio} color={CATEGORY_MAP[b.categoryId].color} height={6} />
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

        {/* Recent activity */}
        <div>
          <SectionTitle action={<Link href="/expenses" className="text-xs font-semibold text-brand">See all</Link>}>
            Recent activity
          </SectionTitle>
          <Card className="p-2">
            {loading ? (
              <div className="space-y-1 p-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="size-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-4 w-14" />
                  </div>
                ))}
              </div>
            ) : recent.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No expenses yet"
                description={isManager ? "Add your first expense to get started." : "Expenses will appear here."}
                action={
                  isManager ? (
                    <Button size="sm" icon={<Plus className="size-4" />} onClick={() => openNew()}>
                      Add expense
                    </Button>
                  ) : undefined
                }
                className="border-0"
              />
            ) : (
              recent.map((e) => <ExpenseRow key={e.id} expense={e} onClick={() => setSelected(e)} />)
            )}
          </Card>
        </div>
      </div>

      <ExpenseDetailSheet expense={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}
