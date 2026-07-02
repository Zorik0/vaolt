"use client";

import { useState } from "react";
import { updateProfile } from "firebase/auth";
import { updateDoc } from "firebase/firestore";
import {
  Check,
  Copy,
  LogOut,
  Monitor,
  Moon,
  RefreshCw,
  SlidersHorizontal,
  Sun,
  UserMinus,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { BudgetEditor } from "@/components/app/BudgetEditor";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Input, Field } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { auth } from "@/lib/firebase/config";
import { userDoc } from "@/lib/db/converters";
import {
  regenerateInviteCode,
  removeMember,
  syncMemberProfile,
  updateHouseholdName,
} from "@/lib/db/households";
import { signOutUser } from "@/lib/firebase/auth";
import { APP_NAME } from "@/lib/constants";
import { totalBudget } from "@/lib/finance";
import { money } from "@/lib/format";
import type { HouseholdMember } from "@/lib/types";

export default function SettingsPage() {
  const { household, appUser, members, uid, isManager, role } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();

  const [name, setName] = useState(appUser?.displayName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [hName, setHName] = useState(household?.name ?? "");
  const [savingHName, setSavingHName] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<HouseholdMember | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const saveName = async () => {
    if (!uid || !household || !name.trim() || name === appUser?.displayName) return;
    setSavingName(true);
    try {
      if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: name.trim() });
      await updateDoc(userDoc(uid), { displayName: name.trim() });
      await syncMemberProfile(household.id, uid, { displayName: name.trim() });
      toast.success("Name updated.");
    } catch {
      toast.error("Couldn't update name.");
    } finally {
      setSavingName(false);
    }
  };

  const saveHName = async () => {
    if (!household || !hName.trim() || hName === household.name) return;
    setSavingHName(true);
    try {
      await updateHouseholdName(household.id, hName.trim());
      toast.success("Household name updated.");
    } catch {
      toast.error("Couldn't update household.");
    } finally {
      setSavingHName(false);
    }
  };

  const copyCode = async () => {
    if (!household) return;
    try {
      await navigator.clipboard.writeText(household.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy.");
    }
  };

  const leaveHousehold = async () => {
    if (!household || !uid) return;
    await removeMember(household.id, uid);
    await updateDoc(userDoc(uid), { householdId: null, role: null });
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your profile and household" />

      <div className="space-y-6">
        {/* Profile */}
        <div>
          <SectionTitle>Profile</SectionTitle>
          <Card className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <Avatar
                name={appUser?.displayName ?? "Me"}
                photoURL={appUser?.photoURL}
                color={household?.members[uid ?? ""]?.color}
                size="lg"
              />
              <div className="min-w-0">
                <p className="truncate text-sm text-muted">{appUser?.email}</p>
                <Badge tone={isManager ? "brand" : "neutral"} className="mt-1">
                  {role === "manager" ? "House Manager" : "Member"}
                </Badge>
              </div>
            </div>
            <Field label="Display name">
              <div className="flex gap-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
                <Button
                  variant="secondary"
                  onClick={saveName}
                  loading={savingName}
                  disabled={!name.trim() || name === appUser?.displayName}
                >
                  Save
                </Button>
              </div>
            </Field>
          </Card>
        </div>

        {/* Appearance */}
        <div>
          <SectionTitle>Appearance</SectionTitle>
          <Card className="p-5">
            <SegmentedControl
              value={theme}
              onChange={setTheme}
              options={[
                { value: "light", label: "Light", icon: <Sun className="size-4" /> },
                { value: "dark", label: "Dark", icon: <Moon className="size-4" /> },
                { value: "system", label: "System", icon: <Monitor className="size-4" /> },
              ]}
            />
          </Card>
        </div>

        {/* Household */}
        <div>
          <SectionTitle>Household</SectionTitle>
          <Card className="space-y-5 p-5">
            {isManager ? (
              <Field label="Household name">
                <div className="flex gap-2">
                  <Input value={hName} onChange={(e) => setHName(e.target.value)} />
                  <Button
                    variant="secondary"
                    onClick={saveHName}
                    loading={savingHName}
                    disabled={!hName.trim() || hName === household?.name}
                  >
                    Save
                  </Button>
                </div>
              </Field>
            ) : (
              <div>
                <p className="text-xs font-medium text-subtle">Household</p>
                <p className="mt-0.5 font-semibold text-foreground">{household?.name}</p>
              </div>
            )}

            {/* Invite code */}
            <div>
              <p className="mb-1.5 text-sm font-medium text-muted">Invite code</p>
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3">
                  <span className="font-mono text-lg font-semibold tracking-[0.25em] text-foreground">
                    {household?.inviteCode}
                  </span>
                  <button onClick={copyCode} className="text-muted transition-colors hover:text-brand" aria-label="Copy code">
                    {copied ? <Check className="size-5 text-positive" /> : <Copy className="size-5" />}
                  </button>
                </div>
                {isManager && (
                  <Button variant="secondary" size="icon" onClick={() => setRegenOpen(true)} aria-label="Regenerate code">
                    <RefreshCw className="size-4" />
                  </Button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-subtle">Share this code so roommates can join.</p>
            </div>

            {isManager && (
              <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
                <div>
                  <p className="text-sm font-medium text-foreground">Monthly budgets</p>
                  <p className="text-xs text-muted">Total {money(totalBudget(household?.budgets ?? {}))}</p>
                </div>
                <Button variant="secondary" size="sm" icon={<SlidersHorizontal className="size-4" />} onClick={() => setBudgetOpen(true)}>
                  Edit
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Members */}
        <div>
          <SectionTitle>Members ({members.length})</SectionTitle>
          <Card className="divide-y divide-border p-0">
            {members.map((m) => (
              <div key={m.uid} className="flex items-center gap-3 p-3.5">
                <Avatar name={m.displayName} photoURL={m.photoURL} color={m.color} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {m.displayName} {m.uid === uid && <span className="text-subtle">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-muted">{m.email}</p>
                </div>
                <Badge tone={m.role === "manager" ? "brand" : "neutral"}>
                  {m.role === "manager" ? "Manager" : "Member"}
                </Badge>
                {isManager && m.uid !== uid && (
                  <button
                    onClick={() => setRemoveTarget(m)}
                    className="grid size-8 place-items-center rounded-lg text-subtle transition-colors hover:text-negative"
                    aria-label="Remove member"
                  >
                    <UserMinus className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </Card>
        </div>

        {/* Account */}
        <div>
          <SectionTitle>Account</SectionTitle>
          <Card className="space-y-2 p-2">
            {!isManager && (
              <button
                onClick={() => setLeaveOpen(true)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
              >
                <UserMinus className="size-5 text-muted" />
                Leave household
              </button>
            )}
            <button
              onClick={() => signOutUser()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-negative transition-colors hover:bg-negative/10"
            >
              <LogOut className="size-5" />
              Sign out
            </button>
          </Card>
          <p className="mt-3 text-center text-xs text-subtle">{APP_NAME} · v1.0.0</p>
        </div>
      </div>

      <BudgetEditor open={budgetOpen} onClose={() => setBudgetOpen(false)} />

      <ConfirmDialog
        open={regenOpen}
        onClose={() => setRegenOpen(false)}
        onConfirm={async () => {
          if (household) {
            await regenerateInviteCode(household.id);
            toast.success("New invite code generated.");
          }
        }}
        title="Regenerate invite code?"
        message="The current code will stop working. You'll need to share the new one."
        confirmLabel="Regenerate"
      />

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={async () => {
          if (household && removeTarget) {
            await removeMember(household.id, removeTarget.uid);
            toast.success(`${removeTarget.displayName.split(" ")[0]} removed.`);
          }
        }}
        title="Remove member?"
        message={`${removeTarget?.displayName ?? "This member"} will lose access to the household. Their past expenses stay in the records.`}
        confirmLabel="Remove"
        danger
      />

      <ConfirmDialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={leaveHousehold}
        title="Leave household?"
        message="You'll lose access to this household's expenses and balances. You can rejoin with the invite code."
        confirmLabel="Leave"
        danger
      />
    </>
  );
}
