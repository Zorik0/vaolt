"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
import { Avatar } from "@/components/ui/Avatar";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { addSettlement } from "@/lib/db/settlements";
import { SETTLEMENT_METHODS } from "@/lib/constants";
import { currentMonthKey, money } from "@/lib/format";
import type { Transfer } from "@/lib/types";

export function SettlementForm({
  open,
  onClose,
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  prefill: Transfer | null;
}) {
  const { household, members, uid } = useAuth();
  const toast = useToast();

  const [amountStr, setAmountStr] = useState("");
  const [method, setMethod] = useState<string>("UPI");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !prefill) return;
    setAmountStr(String(Math.round(prefill.amount)));
    setMethod("UPI");
    setNote("");
  }, [open, prefill]);

  if (!prefill) return null;
  const from = household?.members[prefill.fromUid];
  const to = household?.members[prefill.toUid];
  const amount = parseFloat(amountStr) || 0;

  const submit = async () => {
    if (!household || amount <= 0) return;
    setSaving(true);
    try {
      await addSettlement(
        household.id,
        {
          fromUid: prefill.fromUid,
          toUid: prefill.toUid,
          amount,
          method,
          note,
          month: currentMonthKey(),
          status: "completed",
        },
        uid ?? "",
      );
      toast.success("Payment recorded.");
      onClose();
    } catch {
      toast.error("Couldn't record the payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Record a payment"
      description="Log a transfer between members to settle balances."
      footer={
        <Button className="w-full" size="lg" onClick={submit} loading={saving} disabled={amount <= 0}>
          Record {money(amount)} payment
        </Button>
      }
    >
      <div className="space-y-5 pb-2">
        {/* From → To */}
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-surface-2 p-4">
          <Party name={from?.displayName} photoURL={from?.photoURL} color={from?.color} caption="pays" />
          <ArrowRight className="size-5 shrink-0 text-subtle" />
          <Party name={to?.displayName} photoURL={to?.photoURL} color={to?.color} caption="receives" />
        </div>

        {/* Amount */}
        <div className="flex flex-col items-center">
          <label className="text-xs font-medium uppercase tracking-wide text-subtle">Amount</label>
          <div className="mt-1 flex items-center">
            <span className="text-2xl font-semibold text-subtle">₹</span>
            <input
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-36 bg-transparent text-center text-4xl font-semibold tracking-tight text-foreground tabular-nums outline-none placeholder:text-border-strong"
              placeholder="0"
            />
          </div>
        </div>

        <Field label="Method">
          <SegmentedControl
            value={method}
            onChange={setMethod}
            options={SETTLEMENT_METHODS.map((m) => ({ value: m, label: m }))}
            size="sm"
          />
        </Field>

        <Field label="Note" hint="Optional — e.g. a UPI reference">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" />
        </Field>
      </div>
    </Sheet>
  );
}

function Party({
  name,
  photoURL,
  color,
  caption,
}: {
  name?: string;
  photoURL?: string | null;
  color?: string;
  caption: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <Avatar name={name ?? "?"} photoURL={photoURL} color={color} size="md" />
      <div className="text-center">
        <p className="max-w-[6rem] truncate text-sm font-semibold text-foreground">{name?.split(" ")[0]}</p>
        <p className="text-[0.7rem] text-subtle">{caption}</p>
      </div>
    </div>
  );
}
