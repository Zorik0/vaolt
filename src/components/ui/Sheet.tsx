"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { useIsDesktop } from "@/hooks/useMediaQuery";

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  const maxW = size === "lg" ? "sm:max-w-2xl" : size === "sm" ? "sm:max-w-sm" : "sm:max-w-lg";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={isDesktop ? { opacity: 0, scale: 0.96, y: 12 } : { y: "100%" }}
            animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.97, y: 8 } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className={cn(
              "relative flex max-h-[92dvh] w-full flex-col overflow-hidden border-border bg-overlay shadow-soft-xl",
              "rounded-t-3xl border-t sm:rounded-3xl sm:border",
              maxW,
            )}
          >
            {/* Mobile grab handle */}
            <div className="flex justify-center pt-3 sm:hidden">
              <span className="h-1.5 w-10 rounded-full bg-border-strong" />
            </div>

            {(title || description) && (
              <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-4 sm:pt-5">
                <div className="min-w-0">
                  {title && (
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
                  )}
                  {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="-mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-xl text-subtle transition-colors hover:bg-surface-2 hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3">
              {children}
            </div>

            {footer && (
              <div className="border-t border-border bg-overlay px-5 py-4 safe-b">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
