"use client";

import { useMemo } from "react";
import { Download, PieChart, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { MonthNav } from "@/components/app/MonthNav";
import { StatTile } from "@/components/app/StatTile";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Amount } from "@/components/ui/Amount";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/Progress";
import { DonutChart } from "@/components/ui/charts/DonutChart";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/HouseholdDataProvider";
import { categorySpend, paidByMember, sumExpenses, totalBudget } from "@/lib/finance";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants";
import { money, monthLabel, percent } from "@/lib/format";
import { expensesToCsv, downloadCsv } from "@/lib/export";

export default function ReportsPage() {
  const { household, members } = useAuth();
  const { month, monthExpenses } = useData();

  const budgets = household?.budgets ?? {};
  const budget = totalBudget(budgets);
  const spent = sumExpenses(monthExpenses);
  const diff = budget - spent;

  const spendByCat = useMemo(() => categorySpend(monthExpenses), [monthExpenses]);
  const donutData = useMemo(
    () =>
      CATEGORIES.map((c) => ({ label: c.label, value: spendByCat[c.id], color: c.color })).filter(
        (d) => d.value > 0,
      ),
    [spendByCat],
  );

  const memberIds = useMemo(() => members.map((m) => m.uid), [members]);
  const paid = useMemo(() => paidByMember(monthExpenses, memberIds), [monthExpenses, memberIds]);
  const maxPaid = Math.max(1, ...Object.values(paid));

  const topCategory = donutData.slice().sort((a, b) => b.value - a.value)[0];
  const daysInMonth = new Date(Number(month.split("-")[0]), Number(month.split("-")[1]), 0).getDate();

  const handleExport = () => {
    const csv = expensesToCsv(monthExpenses, members);
    downloadCsv(`vaolt-${month}.csv`, csv);
  };

  if (monthExpenses.length === 0) {
    return (
      <>
        <PageHeader title="Reports" subtitle={monthLabel(month)} action={<MonthNav />} />
        <EmptyState
          icon={PieChart}
          title="Nothing to report yet"
          description="Once expenses are added this month, you'll see a full breakdown here."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={monthLabel(month)}
        action={<MonthNav />}
      />

      {/* Summary tiles */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatTile label="Total spent" value={<Amount value={spent} />} sub={`${monthExpenses.length} expenses`} />
        <StatTile
          label={diff >= 0 ? "Under budget" : "Over budget"}
          value={<Amount value={Math.abs(diff)} />}
          sub={budget > 0 ? `of ${money(budget)} budget` : "No budget set"}
          icon={diff >= 0 ? <TrendingDown className="size-4 text-positive" /> : <TrendingUp className="size-4 text-negative" />}
        />
        <StatTile
          label="Top category"
          value={topCategory ? topCategory.label : "—"}
          sub={topCategory ? money(topCategory.value) : undefined}
        />
        <StatTile
          label="Daily average"
          value={<Amount value={Math.round(spent / daysInMonth)} />}
          sub="per day"
        />
      </div>

      {/* Category breakdown */}
      <div className="mb-6">
        <SectionTitle>Where it went</SectionTitle>
        <Card className="p-5">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
            <DonutChart data={donutData} size={172} stroke={24}>
              <div className="text-center">
                <p className="text-[0.7rem] font-medium text-subtle">Total</p>
                <Amount value={spent} className="text-lg font-semibold text-foreground" />
              </div>
            </DonutChart>
            <div className="w-full flex-1 space-y-2.5">
              {donutData
                .slice()
                .sort((a, b) => b.value - a.value)
                .map((d) => (
                  <div key={d.label} className="flex items-center gap-2.5">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="flex-1 text-sm font-medium text-foreground">{d.label}</span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">{money(d.value)}</span>
                    <span className="w-10 text-right text-xs tabular-nums text-subtle">
                      {percent(d.value / spent)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Contributions */}
      <div className="mb-6">
        <SectionTitle>Who paid</SectionTitle>
        <Card className="space-y-4 p-5">
          {members.map((m) => (
            <div key={m.uid} className="flex items-center gap-3">
              <Avatar name={m.displayName} photoURL={m.photoURL} color={m.color} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{m.displayName.split(" ")[0]}</span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">{money(paid[m.uid] ?? 0)}</span>
                </div>
                <ProgressBar ratio={(paid[m.uid] ?? 0) / maxPaid} color={m.color} height={7} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Budget performance */}
      <div className="mb-6">
        <SectionTitle>Budget performance</SectionTitle>
        <Card className="divide-y divide-border p-0">
          {CATEGORIES.filter((c) => (budgets[c.id] ?? 0) > 0 || spendByCat[c.id] > 0).map((c) => {
            const b = budgets[c.id] ?? 0;
            const s = spendByCat[c.id];
            const over = b > 0 && s > b;
            return (
              <div key={c.id} className="flex items-center justify-between p-3.5">
                <span className="text-sm font-medium text-foreground">{CATEGORY_MAP[c.id].label}</span>
                <div className="flex items-center gap-2 text-sm tabular-nums">
                  <span className="font-semibold text-foreground">{money(s)}</span>
                  <span className="text-subtle">/ {b > 0 ? money(b) : "—"}</span>
                  {b > 0 && (
                    <span className={"min-w-14 whitespace-nowrap text-right text-xs font-medium " + (over ? "text-negative" : "text-positive")}>
                      {over ? `+${money(s - b)}` : `${money(b - s)} left`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      <Button variant="secondary" className="w-full" icon={<Download className="size-4" />} onClick={handleExport}>
        Export {monthLabel(month, true)} as CSV
      </Button>
    </>
  );
}
