"use client";

import { useState } from "react";
import { Sheet } from "./Sheet";
import { Button } from "./Button";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  danger,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} size="sm" title={title}>
      <p className="pb-2 text-sm leading-relaxed text-muted">{message}</p>
      <div className="mt-4 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          className="flex-1"
          onClick={handle}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}
