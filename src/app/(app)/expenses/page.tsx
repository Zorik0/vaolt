"use client";

import { useMemo, useState } from "react";
import { Plus, Receipt, Search, X } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { MonthNav } from "@/components/app/MonthNav";
import { ExpenseRow } from "@/components/app/ExpenseRow";
import { ExpenseDetailSheet } from "@/components/app/ExpenseDetailSheet";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Amount } from "@/components/ui/Amount";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/HouseholdDataProvider";
import { useExpenseForm } from "@/components/providers/ExpenseFormProvider";
import { CATEGORIES } from "@/lib/constants";
import { relativeDay, monthKey } from "@/lib/format";
import { sumExpenses } from "@/lib/finance";
import { cn } from "@/lib/utils/cn";
import type { CategoryId, Expense } from "@/lib/types";

type Sort = "recent" | "highest";

export default function ExpensesPage() {
  const { members, isManager } = useAuth();
  const { monthExpenses, loading } = useData();
  const { openNew } = useExpenseForm();

  const [selected, setSelected] = useState<Expense | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [paidBy, setPaidBy] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("recent");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = monthExpenses.filter((e) => {
      if (category !== "all" && e.categoryId !== category) return false;
      if (paidBy !== "all" && e.paidBy !== paidBy) return false;
      if (q && !`${e.description} ${e.notes}`.toLowerCase().includes(q)) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => (sort === "highest" ? b.amount - a.amount : b.date - a.date));
    return rows;
  }, [monthExpenses, query, category, paidBy, sort]);

  const grouped = useMemo(() => {
    if (sort !== "recent") return null;
    const map = new Map<string, Expense[]>();
    for (const e of filtered) {
      const key = monthKey(e.date) + "-" + new Date(e.date).getDate();
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return Array.from(map.values());
  }, [filtered, sort]);

  const total = sumExpenses(filtered);
  const activeFilters = category !== "all" || paidBy !== "all" || query.trim() !== "";

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setPaidBy("all");
  };

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle={`${filtered.length} ${filtered.length === 1 ? "expense" : "expenses"} · total spent shown below`}
        action={<MonthNav />}
      />

      {/* Controls */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search expenses…"
            className="pl-10"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-subtle hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
          <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
            All
          </FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c.id}
              active={category === c.id}
              onClick={() => setCategory(c.id)}
              color={c.color}
            >
              {c.label}
            </FilterChip>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className="h-10 flex-1 text-sm">
            <option value="all">Anyone paid</option>
            {members.map((m) => (
              <option key={m.uid} value={m.uid}>
                {m.displayName} paid
              </option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-10 flex-1 text-sm">
            <option value="recent">Most recent</option>
            <option value="highest">Highest amount</option>
          </Select>
        </div>
      </div>

      {/* Summary bar */}
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3">
        <span className="text-sm text-muted">
          {activeFilters ? "Filtered total" : "Total this month"}
        </span>
        <Amount value={total} className="text-lg font-semibold text-foreground" />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={activeFilters ? "No matching expenses" : "No expenses this month"}
          description={
            activeFilters
              ? "Try adjusting your search or filters."
              : isManager
                ? "Add an expense to start tracking."
                : "Expenses recorded this month will show up here."
          }
          action={
            activeFilters ? (
              <Button size="sm" variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : isManager ? (
              <Button size="sm" icon={<Plus className="size-4" />} onClick={() => openNew()}>
                Add expense
              </Button>
            ) : undefined
          }
        />
      ) : grouped ? (
        <div className="space-y-5">
          {grouped.map((group, i) => (
            <div key={i}>
              <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-subtle">
                {relativeDay(group[0].date)}
              </p>
              <Card className="p-2">
                {group.map((e) => (
                  <ExpenseRow key={e.id} expense={e} showDate={false} onClick={() => setSelected(e)} />
                ))}
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-2">
          {filtered.map((e) => (
            <ExpenseRow key={e.id} expense={e} onClick={() => setSelected(e)} />
          ))}
        </Card>
      )}

      <ExpenseDetailSheet expense={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}

function FilterChip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-transparent bg-foreground text-background"
          : "border-border bg-surface text-muted hover:bg-surface-2",
      )}
    >
      {color && (
        <span className="size-2 rounded-full" style={{ backgroundColor: active ? "currentColor" : color }} />
      )}
      {children}
    </button>
  );
}
