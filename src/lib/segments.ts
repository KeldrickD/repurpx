import type { Fan } from "@prisma/client";

export type SegmentKey =
  | "WHALE"
  | "MID"
  | "LOW"
  | "NEW"
  | "EXPIRING"
  | "GHOST";

export const SEGMENT_CONFIG: Record<
  SegmentKey,
  { label: string; description: string; threshold?: string }
> = {
  WHALE: {
    label: "Whales",
    description: "Spent ≥ $500 all-time",
    threshold: "$500+ lifetime",
  },
  MID: {
    label: "Mid spenders",
    description: "Spent $100–$499",
    threshold: "$100–$499 lifetime",
  },
  LOW: {
    label: "Low spenders",
    description: "Spent <$100 or brand new",
  },
  NEW: {
    label: "New subs",
    description: "Joined within the last 7 days",
  },
  EXPIRING: {
    label: "Expiring soon",
    description: "Rebill date within the next 3 days",
  },
  GHOST: {
    label: "Ghosts",
    description: "No replies or tips for 30+ days",
  },
};

const MS_IN_DAY = 86_400_000;
const WHALE_THRESHOLD = 500;
const MID_THRESHOLD = 100;
const NEW_WINDOW_DAYS = 7;
const EXPIRING_WINDOW_DAYS = 3;
const GHOST_WINDOW_DAYS = 30;

const daysSince = (date?: Date | null) => {
  if (!date) return Infinity;
  return (Date.now() - date.getTime()) / MS_IN_DAY;
};

export function getSegmentForFan(
  fan: Pick<
    Fan,
    "lifetimeSpend" | "joinedAt" | "rebillDate" | "lastMessageAt" | "createdAt"
  >,
): SegmentKey {
  const lifetimeSpend = Number(fan.lifetimeSpend ?? 0);

  if (lifetimeSpend >= WHALE_THRESHOLD) return "WHALE";
  if (fan.joinedAt && daysSince(fan.joinedAt) <= NEW_WINDOW_DAYS) {
    return "NEW";
  }
  if (
    fan.rebillDate &&
    fan.rebillDate.getTime() >= Date.now() &&
    fan.rebillDate.getTime() - Date.now() <= EXPIRING_WINDOW_DAYS * MS_IN_DAY
  ) {
    return "EXPIRING";
  }
  if (daysSince(fan.lastMessageAt ?? fan.createdAt) >= GHOST_WINDOW_DAYS) {
    return "GHOST";
  }
  if (lifetimeSpend >= MID_THRESHOLD) return "MID";
  return "LOW";
}

