import { pool } from "../config/db";
import type { SmsStatus } from "../types";

export async function logSms(
  recipient: string,
  message: string,
  orderId: number | null,
  deliveryId: number | null,
  status: SmsStatus = "pending",
  providerRef: string | null = null
): Promise<number> {
  const [result] = await pool.query(
    `INSERT INTO sms_log (order_id, delivery_id, recipient, message, status, provider_ref)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [orderId, deliveryId, recipient, message, status, providerRef]
  );
  return (result as { insertId: number }).insertId;
}

export async function updateSmsStatus(
  id: number,
  status: SmsStatus,
  providerRef: string | null = null
): Promise<void> {
  await pool.query(
    "UPDATE sms_log SET status = ?, provider_ref = ? WHERE id = ?",
    [status, providerRef, id]
  );
}
