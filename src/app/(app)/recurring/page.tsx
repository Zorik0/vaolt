"use client";

import { useState } from "react";
import { Lock, Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { RecurringForm } from "@/components/app/RecurringForm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Amount } from "@/components/ui/Amount";
import { Switch } from "@/components/ui/Switch";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CategoryChip } from "@/components/ui/CategoryIcon";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/HouseholdDataProvider";
import { deleteRecurring, updateRecurring } from "@/lib/db/recurring";
import { CATEGORY_MAP } from "@/lib/constants";
import type { RecurringExpense } from "@/lib/types";

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
};

export default function RecurringPage() {
  const { household, isManager } = useAuth();
  const { recurring } = useData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [toDelete, setToDelete] = useState<RecurringExpense | null>(null);

  if (!isManager) {
    return (
      <>
        <PageHeader title="Recurring" subtitle="Automated monthly expenses" />
        <EmptyState
          icon={Lock}
          title="Manager only"
          description="Only the house manager can set up recurring expenses."
        />
      </>
    );
  }

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (r: RecurringExpense) => {
    setEditing(r);
    setFormOpen(true);
  };

  const sorted = [...recurring].sort((a, b) => a.dayOfMonth - b.dayOfMonth);

  return (
    <>
      <PageHeader
        title="Recurring"
        subtitle="Bills that repeat every month"
        action={
          <Button size="sm" icon={<Plus className="size-4" />} onClick={openNew}>
            New
          </Button>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring expenses"
          description="Add rent, WiFi or maintenance once and Vaolt will log them automatically each month."
          action={
            <Button size="sm" icon={<Plus className="size-4" />} onClick={openNew}>
              Add recurring expense
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-center gap-3">
                <CategoryChip id={r.categoryId} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-foreground">{r.description}</p>
                    {!r.active && <Badge tone="neutral">Paused</Badge>}
                  </div>
                  <p className="text-xs text-muted">
                    {CATEGORY_MAP[r.categoryId].label} · {ordinal(r.dayOfMonth)} each month ·{" "}
                    {r.splitType === "none" ? "Not split" : `Split ${r.splitBetween.length} ways`}
                  </p>
                </div>
                <Amount value={r.amount} className="font-semibold text-foreground" />
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={r.active}
                    onChange={(v) => household && updateRecurring(household.id, r.id, { active: v })}
                  />
                  <span className="text-xs text-muted">{r.active ? "Active" : "Paused"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(r)}
                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                    aria-label="Edit"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setToDelete(r)}
                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-negative"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <RecurringForm open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (household && toDelete) await deleteRecurring(household.id, toDelete.id);
        }}
        title="Delete recurring expense?"
        message="This won't remove expenses already added — it just stops future ones."
        confirmLabel="Delete"
        danger
      />
    </>
  );
}
