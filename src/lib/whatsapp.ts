/**
 * Normalizes a phone number to international format (62 for Indonesia).
 * Example: 08123456789 -> 628123456789
 * @param phone The phone number to normalize
 * @returns Normalized phone number string
 */
export function normalizePhoneNumber(phone: string): string {
  if (phone.includes("@g.us")) {
    return phone;
  }

  let cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }

  return cleaned;
}

/**
 * Sends a WhatsApp reminder using Fonnte service.
 * @param target The recipient's phone number
 * @param message The message content
 */
export async function sendWhatsappReminder(target: string, message: string) {
  const token = process.env.FONNTE_TOKEN;

  if (!token) {
    console.error("[WhatsApp Reminder] Error: FONNTE_TOKEN is not set in environment variables.");
    return;
  }

  const normalizedTarget = normalizePhoneNumber(target);

  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        target: normalizedTarget,
        message: message,
        token: token, // Added token here as well
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.status) {
      console.error("[WhatsApp Reminder] Fonnte API Error:", result);
    } else {
      console.log(`[WhatsApp Reminder] Message sent successfully to ${normalizedTarget}`);
    }
  } catch (error) {
    console.error("[WhatsApp Reminder] Network Error:", error);
  }
}
