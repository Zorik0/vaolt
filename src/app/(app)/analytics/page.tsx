"use client";

import { useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatTile } from "@/components/app/StatTile";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Amount } from "@/components/ui/Amount";
import { Badge } from "@/components/ui/Badge";
import { CategoryChip } from "@/components/ui/CategoryIcon";
import { BarChart } from "@/components/ui/charts/BarChart";
import { DonutChart } from "@/components/ui/charts/DonutChart";
import { useData } from "@/components/providers/HouseholdDataProvider";
import { categorySpend, sumExpenses } from "@/lib/finance";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants";
import { currentMonthKey, moneyShort, money, monthLabel, percent, shiftMonth } from "@/lib/format";

const WINDOW = 12;

export default function AnalyticsPage() {
  const { windowExpenses } = useData();

  const months = useMemo(
    () => Array.from({ length: WINDOW }, (_, i) => shiftMonth(currentMonthKey(), -(WINDOW - 1 - i))),
    [],
  );

  const monthly = useMemo(
    () =>
      months.map((k) => ({
        key: k,
        total: sumExpenses(windowExpenses.filter((e) => e.month === k)),
      })),
    [months, windowExpenses],
  );

  const totalWindow = monthly.reduce((s, m) => s + m.total, 0);
  const activeMonths = monthly.filter((m) => m.total > 0).length;
  const avg = activeMonths ? totalWindow / activeMonths : 0;
  const thisMonth = monthly[monthly.length - 1]?.total ?? 0;
  const lastMonth = monthly[monthly.length - 2]?.total ?? 0;
  const delta = lastMonth > 0 ? (thisMonth - lastMonth) / lastMonth : 0;
  const highest = monthly.reduce((a, b) => (b.total > a.total ? b : a), monthly[0] ?? { key: "", total: 0 });

  const spendByCat = useMemo(() => categorySpend(windowExpenses), [windowExpenses]);
  const donutData = useMemo(
    () =>
      CATEGORIES.map((c) => ({ label: c.label, value: spendByCat[c.id], color: c.color })).filter(
        (d) => d.value > 0,
      ),
    [spendByCat],
  );
  const topCats = useMemo(
    () =>
      CATEGORIES.map((c) => ({ id: c.id, value: spendByCat[c.id] }))
        .filter((c) => c.value > 0)
        .sort((a, b) => b.value - a.value),
    [spendByCat],
  );

  const barData = monthly.map((m) => ({
    label: monthLabel(m.key, true).split(" ")[0],
    value: m.total,
  }));

  return (
    <>
      <PageHeader title="Analytics" subtitle={`Trends across the last ${WINDOW} months`} />

      {/* Insight tiles */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatTile label="Avg / month" value={<Amount value={Math.round(avg)} />} sub="Active months" />
        <StatTile
          label="This vs last month"
          value={
            <span className={delta > 0 ? "text-negative" : delta < 0 ? "text-positive" : "text-foreground"}>
              {lastMonth > 0 ? `${delta > 0 ? "+" : ""}${percent(delta)}` : "—"}
            </span>
          }
          sub={<Amount value={thisMonth} />}
          icon={delta > 0 ? <TrendingUp className="size-4 text-negative" /> : <TrendingDown className="size-4 text-positive" />}
        />
        <StatTile label="Highest month" value={<Amount value={highest.total} />} sub={highest.key ? monthLabel(highest.key, true) : "—"} />
        <StatTile label="Total tracked" value={<Amount value={totalWindow} />} sub={`${WINDOW} months`} />
      </div>

      {/* Monthly trend */}
      <div className="mb-6">
        <SectionTitle>Monthly spending</SectionTitle>
        <Card className="p-5">
          {totalWindow === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No spending data yet.</p>
          ) : (
            <BarChart data={barData} height={180} formatValue={moneyShort} />
          )}
        </Card>
      </div>

      {/* Category split */}
      {donutData.length > 0 && (
        <div className="mb-6">
          <SectionTitle>Category split</SectionTitle>
          <Card className="p-5">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
              <DonutChart data={donutData} size={168} stroke={22}>
                <div className="text-center">
                  <p className="text-[0.7rem] font-medium text-subtle">Total</p>
                  <span className="text-base font-semibold text-foreground">{moneyShort(totalWindow)}</span>
                </div>
              </DonutChart>
              <div className="w-full flex-1 space-y-3">
                {topCats.map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <CategoryChip id={c.id} size="sm" />
                    <span className="flex-1 text-sm font-medium text-foreground">{CATEGORY_MAP[c.id].label}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold tabular-nums text-foreground">{money(c.value)}</span>
                      <Badge tone="neutral" className="ml-2">{percent(c.value / totalWindow)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
