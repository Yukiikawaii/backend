import { logSms, updateSmsStatus } from "../models/sms.model";

const SEMAPHORE_API_KEY = process.env.SEMAPHORE_API_KEY;
const SEMAPHORE_SENDER  = process.env.SEMAPHORE_SENDER_NAME ?? "AquaGrace";
const SEMAPHORE_URL     = "https://api.semaphore.co/api/v4/messages";

/**
 * Builds the delivery confirmation SMS message.
 */
export function buildDeliveryConfirmationMessage(orderTotal: number): string {
  return (
    `Your Aqua Grace order (₱${orderTotal.toFixed(2)}) has been delivered. ` +
    `Please confirm receipt by replying: 1 - Yes, received | 2 - There's an issue. ` +
    `If no reply within 1 hour, delivery will be automatically marked as received.`
  );
}

/**
 * Sends an SMS via Semaphore. Falls back to console log if API key is not set.
 */
export async function sendSms(
  recipient: string,
  message: string,
  orderId: number | null = null,
  deliveryId: number | null = null
): Promise<void> {
  // Log first regardless of send outcome
  const logId = await logSms(recipient, message, orderId, deliveryId, "pending");

  if (!SEMAPHORE_API_KEY) {
    // Dev fallback — print to console
    const line = `[sms-dev] To: ${recipient} | Message: ${message}`;
    console.log(line);
    await updateSmsStatus(logId, "sent", "dev-fallback");
    return;
  }

  try {
    const response = await fetch(SEMAPHORE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: SEMAPHORE_API_KEY,
        number: recipient,
        message,
        sendername: SEMAPHORE_SENDER,
      }),
    });

    const data = await response.json() as { message_id?: string }[];
    const ref = data?.[0]?.message_id ?? null;
    await updateSmsStatus(logId, response.ok ? "sent" : "failed", ref ? String(ref) : null);
  } catch (err) {
    console.error("[sms] Send failed:", err);
    await updateSmsStatus(logId, "failed");
  }
}
