/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils/cn";
import { initials } from "@/lib/format";
import type { HouseholdMember } from "@/lib/types";

const SIZES = {
  xs: "size-6 text-[0.6rem]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
} as const;

type Size = keyof typeof SIZES;

export function Avatar({
  name,
  photoURL,
  color = "#d9600b",
  size = "md",
  className,
  ring,
}: {
  name: string;
  photoURL?: string | null;
  color?: string;
  size?: Size;
  className?: string;
  ring?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white",
        SIZES[size],
        ring && "ring-2 ring-surface",
        className,
      )}
      style={{ backgroundColor: photoURL ? undefined : color }}
      title={name}
    >
      {photoURL ? (
        <img src={photoURL} alt={name} className="size-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span className="tracking-tight">{initials(name)}</span>
      )}
    </span>
  );
}

export function AvatarGroup({
  members,
  size = "sm",
  max = 4,
}: {
  members: Pick<HouseholdMember, "displayName" | "photoURL" | "color">[];
  size?: Size;
  max?: number;
}) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((m, i) => (
        <Avatar
          key={i}
          name={m.displayName}
          photoURL={m.photoURL}
          color={m.color}
          size={size}
          ring
        />
      ))}
      {extra > 0 && (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-surface-3 font-semibold text-muted ring-2 ring-surface",
            SIZES[size],
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
