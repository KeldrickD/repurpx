import { DancerCustomerTier } from "@prisma/client";

export type DancerSegmentationConfig = {
  whaleSpendCents: number;
  regularSpendCents: number;
  inactivityDaysWarning: number;
  inactivityDaysCold: number;
};

export const DEFAULT_DANCER_SEGMENT_CONFIG: DancerSegmentationConfig = {
  whaleSpendCents: 100_000,
  regularSpendCents: 20_000,
  inactivityDaysWarning: 21,
  inactivityDaysCold: 45,
};

export type DancerCustomerLike = {
  totalSpendCents: number;
  visitsCount?: number | null;
  lastVisitAt?: Date | null;
  tier?: DancerCustomerTier | null;
};

export type DancerActivityStatus = "ACTIVE" | "AT_RISK" | "COLD" | "UNKNOWN";

export function daysSince(date: Date | null | undefined): number | null {
  if (!date) return null;
  const diffMs = Date.now() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function getDancerTierForCustomer(
  customer: DancerCustomerLike,
  config: DancerSegmentationConfig = DEFAULT_DANCER_SEGMENT_CONFIG,
): DancerCustomerTier {
  const spend = customer.totalSpendCents ?? 0;
  const visits = customer.visitsCount ?? 0;

  if (spend >= config.whaleSpendCents || visits >= 10) {
    return DancerCustomerTier.WHALE;
  }

  if (spend >= config.regularSpendCents || visits >= 3) {
    return DancerCustomerTier.REGULAR;
  }

  if (visits > 0 || spend > 0) {
    return DancerCustomerTier.OCCASIONAL;
  }

  return DancerCustomerTier.TEST;
}

export function getDancerActivityStatus(
  customer: DancerCustomerLike,
  config: DancerSegmentationConfig = DEFAULT_DANCER_SEGMENT_CONFIG,
): DancerActivityStatus {
  const since = daysSince(customer.lastVisitAt ?? null);
  if (since == null) return "UNKNOWN";
  if (since <= config.inactivityDaysWarning) return "ACTIVE";
  if (since <= config.inactivityDaysCold) return "AT_RISK";
  return "COLD";
}

export function isDancerInactive30DaysOrMore(customer: DancerCustomerLike) {
  const since = daysSince(customer.lastVisitAt ?? null);
  return since != null && since >= 30;
}

