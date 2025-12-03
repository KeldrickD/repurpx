import twilio from "twilio";
import { getOrCreateSmsNumberForAccount } from "@/lib/smsAccounts";

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

export async function sendSmsRaw(
  from: string,
  to: string,
  body: string,
): Promise<{ sid: string }> {
  const client = getTwilioClient();
  const message = await client.messages.create({ from, to, body });
  return { sid: message.sid };
}

export async function sendAccountSms(
  creatorAccountId: string,
  to: string,
  body: string,
): Promise<{ sid: string }> {
  const { phoneNumber } = await getOrCreateSmsNumberForAccount(
    creatorAccountId,
  );
  return sendSmsRaw(phoneNumber, to, body);
}

