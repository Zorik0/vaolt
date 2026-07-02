import {
  Building2,
  Droplets,
  Home,
  ShoppingBasket,
  Shapes,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CATEGORY_MAP } from "@/lib/constants";
import type { CategoryId } from "@/lib/types";

export const CATEGORY_ICON: Record<CategoryId, LucideIcon> = {
  rent: Home,
  maintenance: Building2,
  electricity: Zap,
  water: Droplets,
  wifi: Wifi,
  groceries: ShoppingBasket,
  other: Shapes,
};

const CHIP_SIZE = {
  sm: "size-8 rounded-lg",
  md: "size-10 rounded-xl",
  lg: "size-12 rounded-2xl",
} as const;

const ICON_SIZE = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
} as const;

/** A category glyph inside a tinted rounded chip. */
export function CategoryChip({
  id,
  size = "md",
  className,
}: {
  id: CategoryId;
  size?: keyof typeof CHIP_SIZE;
  className?: string;
}) {
  const meta = CATEGORY_MAP[id];
  const Icon = CATEGORY_ICON[id];
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center", CHIP_SIZE[size], className)}
      style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
    >
      <Icon className={ICON_SIZE[size]} strokeWidth={2} />
    </span>
  );
}
