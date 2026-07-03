"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, HandCoins, Plus, Sparkles, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SettlementForm } from "@/components/app/SettlementForm";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Amount } from "@/components/ui/Amount";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/HouseholdDataProvider";
import { deleteSettlement } from "@/lib/db/settlements";
import { formatDate, money } from "@/lib/format";
import type { Settlement, Transfer } from "@/lib/types";

export default function BalancesPage() {
  const { household, members, uid, isManager } = useAuth();
  const { balances, transfers, settlements, myBalance } = useData();
  const [form, setForm] = useState<Transfer | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Settlement | null>(null);

  const memberOf = (id: string) => household?.members[id];
  const firstName = (id: string) => memberOf(id)?.displayName.split(" ")[0] ?? "Someone";

  const net = myBalance?.net ?? 0;
  const owed = net > 0.5;
  const owes = net < -0.5;

  const completed = useMemo(
    () => settlements.filter((s) => s.status === "completed"),
    [settlements],
  );

  const openSettle = (t: Transfer) => {
    setForm(t);
    setFormOpen(true);
  };

  const openManual = () => {
    const other = members.find((m) => m.uid !== uid);
    setForm({ fromUid: uid ?? "", toUid: other?.uid ?? "", amount: 0 });
    setFormOpen(true);
  };

  const canSettle = (t: Transfer) => isManager || t.fromUid === uid;

  return (
    <>
      <PageHeader
        title="Balances"
        subtitle="Who owes whom, settled in the fewest transfers"
        action={
          isManager ? (
            <Button variant="secondary" size="sm" icon={<Plus className="size-4" />} onClick={openManual}>
              Record
            </Button>
          ) : undefined
        }
      />

      {/* Your position */}
      <Card className="mb-6 overflow-hidden p-0">
        <div className="flex flex-col items-center gap-1 p-6 text-center">
          <span className="text-xs font-medium uppercase tracking-wide text-subtle">Your balance</span>
          <Amount value={net} colorize absolute className="text-4xl font-semibold tracking-tight" />
          <p className="text-sm text-muted">
            {owed ? "Others owe you overall" : owes ? "You owe overall" : "You're all settled up"}
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border border-t border-border text-center">
          <div className="p-3">
            <p className="text-xs text-subtle">You paid</p>
            <Amount value={myBalance?.paid ?? 0} className="font-semibold text-foreground" />
          </div>
          <div className="p-3">
            <p className="text-xs text-subtle">Your share</p>
            <Amount value={myBalance?.share ?? 0} className="font-semibold text-foreground" />
          </div>
        </div>
      </Card>

      {/* Settle up */}
      <div className="mb-6">
        <SectionTitle
          action={
            transfers.length > 0 ? (
              <Badge tone="brand" icon={<Sparkles className="size-3" />}>
                {transfers.length} {transfers.length === 1 ? "transfer" : "transfers"}
              </Badge>
            ) : undefined
          }
        >
          Settle up
        </SectionTitle>
        {transfers.length === 0 ? (
          <EmptyState
            icon={Check}
            title="Everyone's settled up"
            description="There are no outstanding balances right now."
          />
        ) : (
          <Card className="divide-y divide-border p-0">
            {transfers.map((t, i) => (
              <div key={i} className="flex items-center gap-3 p-3.5">
                <div className="flex flex-1 items-center gap-2">
                  <Avatar name={memberOf(t.fromUid)?.displayName ?? "?"} photoURL={memberOf(t.fromUid)?.photoURL} color={memberOf(t.fromUid)?.color} size="sm" />
                  <div className="min-w-0 text-sm">
                    <span className="font-semibold text-foreground">{firstName(t.fromUid)}</span>
                    <span className="text-muted"> pays </span>
                    <span className="font-semibold text-foreground">{firstName(t.toUid)}</span>
                  </div>
                </div>
                <Amount value={t.amount} className="font-semibold text-foreground" />
                {canSettle(t) && (
                  <Button size="sm" variant="secondary" onClick={() => openSettle(t)}>
                    Settle
                  </Button>
                )}
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Everyone's balances */}
      <div className="mb-6">
        <SectionTitle>Everyone</SectionTitle>
        <Card className="divide-y divide-border p-0">
          {balances.map((b) => {
            const m = memberOf(b.uid);
            const isYou = b.uid === uid;
            return (
              <div key={b.uid} className="flex items-center gap-3 p-3.5">
                <Avatar name={m?.displayName ?? "?"} photoURL={m?.photoURL} color={m?.color} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {m?.displayName ?? "Unknown"} {isYou && <span className="text-subtle">(you)</span>}
                  </p>
                  <p className="text-xs text-muted">
                    Paid {money(b.paid)} · Share {money(b.share)}
                  </p>
                </div>
                <div className="text-right">
                  <Amount value={b.net} colorize absolute className="font-semibold" />
                  <p className="text-xs text-subtle">
                    {b.net > 0.5 ? "is owed" : b.net < -0.5 ? "owes" : "settled"}
                  </p>
                </div>
              </div>
            );
          })}
        </Card>
        <p className="mt-2 px-1 text-xs text-subtle">
          Balances reflect all unsettled expenses and recorded payments.
        </p>
      </div>

      {/* History */}
      <div>
        <SectionTitle>Payment history</SectionTitle>
        {completed.length === 0 ? (
          <EmptyState icon={HandCoins} title="No payments recorded yet" description="Settled transfers will appear here." />
        ) : (
          <Card className="divide-y divide-border p-0">
            {completed.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3.5">
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-positive/10 text-positive">
                  <ArrowRight className="size-4" />
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate">
                    <span className="font-semibold text-foreground">{firstName(s.fromUid)}</span>
                    <span className="text-muted"> paid </span>
                    <span className="font-semibold text-foreground">{firstName(s.toUid)}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {s.method}
                    {s.createdAt && ` · ${formatDate(s.createdAt.toMillis())}`}
                    {s.note ? ` · ${s.note}` : ""}
                  </p>
                </div>
                <Amount value={s.amount} className="font-semibold text-foreground" />
                {isManager && (
                  <button
                    onClick={() => setToDelete(s)}
                    className="rounded-lg p-1.5 text-subtle transition-colors hover:text-negative"
                    aria-label="Delete payment"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </Card>
        )}
      </div>

      <SettlementForm open={formOpen} onClose={() => setFormOpen(false)} prefill={form} />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (household && toDelete) await deleteSettlement(household.id, toDelete.id);
        }}
        title="Delete payment?"
        message="This removes the recorded payment and will re-open the balance between these members."
        confirmLabel="Delete"
        danger
      />
    </>
  );
}
