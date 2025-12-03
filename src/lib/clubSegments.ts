import { ClubVipStatus } from "@prisma/client";

export type ClubSegmentationConfig = {
  bronzeSpendCents: number;
  silverSpendCents: number;
  goldSpendCents: number;
  platinumSpendCents: number;
  visitsBronze: number;
  visitsSilver: number;
  visitsGold: number;
  visitsPlatinum: number;
  inactiveDaysWarning: number;
  inactiveDaysCold: number;
  birthdayWindowDays: number;
};

export const DEFAULT_CLUB_SEGMENT_CONFIG: ClubSegmentationConfig = {
  bronzeSpendCents: 20_000,
  silverSpendCents: 50_000,
  goldSpendCents: 150_000,
  platinumSpendCents: 500_000,
  visitsBronze: 3,
  visitsSilver: 6,
  visitsGold: 10,
  visitsPlatinum: 20,
  inactiveDaysWarning: 30,
  inactiveDaysCold: 90,
  birthdayWindowDays: 7,
};

export type ClubPatronLike = {
  totalSpendCents: number;
  visitsCount?: number | null;
  lastVisitAt?: Date | null;
  vipStatus?: ClubVipStatus | null;
  birthday?: Date | null;
};

export type ClubActivityStatus = "ACTIVE" | "AT_RISK" | "COLD" | "UNKNOWN";

function daysBetween(a: Date, b: Date) {
  const diffMs = a.getTime() - b.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function daysSince(date?: Date | null) {
  if (!date) return null;
  const now = new Date();
  return daysBetween(now, date);
}

export function getRecommendedVipStatus(
  patron: ClubPatronLike,
  config: ClubSegmentationConfig = DEFAULT_CLUB_SEGMENT_CONFIG,
): ClubVipStatus {
  const spend = patron.totalSpendCents ?? 0;
  const visits = patron.visitsCount ?? 0;

  if (spend >= config.platinumSpendCents || visits >= config.visitsPlatinum) {
    return ClubVipStatus.PLATINUM;
  }

  if (spend >= config.goldSpendCents || visits >= config.visitsGold) {
    return ClubVipStatus.GOLD;
  }

  if (spend >= config.silverSpendCents || visits >= config.visitsSilver) {
    return ClubVipStatus.SILVER;
  }

  if (spend >= config.bronzeSpendCents || visits >= config.visitsBronze) {
    return ClubVipStatus.BRONZE;
  }

  return ClubVipStatus.NONE;
}

export function getClubActivityStatus(
  patron: ClubPatronLike,
  config: ClubSegmentationConfig = DEFAULT_CLUB_SEGMENT_CONFIG,
): ClubActivityStatus {
  const since = daysSince(patron.lastVisitAt ?? null);
  if (since == null) return "UNKNOWN";
  if (since <= config.inactiveDaysWarning) return "ACTIVE";
  if (since <= config.inactiveDaysCold) return "AT_RISK";
  return "COLD";
}

export function hasUpcomingBirthday(
  patron: ClubPatronLike,
  config: ClubSegmentationConfig = DEFAULT_CLUB_SEGMENT_CONFIG,
) {
  if (!patron.birthday) return false;
  const now = new Date();
  const birthdayThisYear = new Date(
    now.getFullYear(),
    patron.birthday.getMonth(),
    patron.birthday.getDate(),
  );

  const diff = daysBetween(birthdayThisYear, now);
  return diff >= 0 && diff <= config.birthdayWindowDays;
}

