import twilio from "twilio";
import { prisma } from "@/lib/prisma";

let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (twilioClient) return twilioClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error("Twilio credentials not configured");
  }
  twilioClient = twilio(sid, token);
  return twilioClient;
}

export async function getOrCreateSmsNumberForAccount(
  creatorAccountId: string,
) {
  const existing = await prisma.smsNumber.findUnique({
    where: { creatorAccountId },
  });

  if (existing && !existing.releasedAt) {
    return { phoneNumber: existing.phoneNumber };
  }

  const client = getTwilioClient();
  const [available] = await client.availablePhoneNumbers("US").local.list({
    smsEnabled: true,
    limit: 1,
  });

  if (!available?.phoneNumber) {
    throw new Error("No available Twilio numbers found");
  }

  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: available.phoneNumber,
  });

  const smsNumber = await prisma.smsNumber.upsert({
    where: { creatorAccountId },
    update: {
      phoneNumber: purchased.phoneNumber,
      providerSid: purchased.sid,
      releasedAt: null,
    },
    create: {
      creatorAccountId,
      phoneNumber: purchased.phoneNumber,
      providerSid: purchased.sid,
    },
  });

  return { phoneNumber: smsNumber.phoneNumber };
}

