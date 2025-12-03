"use server";

const TELEGRAM_API_BASE = "https://api.telegram.org";

export async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  const response = await fetch(
    `${TELEGRAM_API_BASE}/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    },
  );

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(
      data?.description || "Telegram responded with an error.",
    );
  }

  return data;
}

