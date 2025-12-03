import { startOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";

export class SmsLimitError extends Error {
  code: "SMS_NOT_ALLOWED" | "SMS_LIMIT_EXCEEDED";
  remaining: number;

  constructor(
    code: "SMS_NOT_ALLOWED" | "SMS_LIMIT_EXCEEDED",
    message: string,
    remaining = 0,
  ) {
    super(message);
    this.code = code;
    this.remaining = remaining;
  }
}

export async function assertCanSendSms(
  creatorAccountId: string,
  countToSend: number,
) {
  const account = await prisma.creatorAccount.findUnique({
    where: { id: creatorAccountId },
    select: {
      monthlySmsLimit: true,
      smsPeriodStart: true,
    },
  });

  if (!account) {
    throw new Error("Creator account not found.");
  }

  if (!account.monthlySmsLimit || account.monthlySmsLimit <= 0) {
    throw new SmsLimitError(
      "SMS_NOT_ALLOWED",
      "Your current plan does not include SMS credits.",
    );
  }

  const periodStart = account.smsPeriodStart ?? startOfMonth(new Date());

  const aggregate = await prisma.outboundSms.aggregate({
    where: {
      creatorAccountId,
      createdAt: { gte: periodStart },
    },
    _sum: {
      successCount: true,
    },
  });

  const used = aggregate._sum.successCount ?? 0;
  const remaining = account.monthlySmsLimit - used;

  if (remaining <= 0 || remaining < countToSend) {
    throw new SmsLimitError(
      "SMS_LIMIT_EXCEEDED",
      "You have reached your monthly SMS limit.",
      Math.max(remaining, 0),
    );
  }

  return { remaining, used };
}
