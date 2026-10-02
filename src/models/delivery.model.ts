import { pool } from "../config/db";
import type { DeliveryRecord, ComplaintType } from "../types";

export async function createDelivery(orderId: number, staffId: number): Promise<number> {
  const [result] = await pool.query(
    `INSERT INTO deliveries (order_id, staff_id, status) VALUES (?, ?, 'assigned')`,
    [orderId, staffId]
  );
  return (result as { insertId: number }).insertId;
}

export async function getDeliveryByOrderId(orderId: number): Promise<DeliveryRecord | null> {
  const [rows] = await pool.query(
    "SELECT * FROM deliveries WHERE order_id = ? LIMIT 1",
    [orderId]
  );
  const records = rows as DeliveryRecord[];
  return records[0] ?? null;
}

export async function getDeliveryById(id: number): Promise<DeliveryRecord | null> {
  const [rows] = await pool.query(
    "SELECT * FROM deliveries WHERE id = ? LIMIT 1",
    [id]
  );
  const records = rows as DeliveryRecord[];
  return records[0] ?? null;
}

export async function getDeliveriesByStaff(staffId: number): Promise<DeliveryRecord[]> {
  const [rows] = await pool.query(
    `SELECT d.*, o.consumer_name, o.consumer_phone, o.consumer_address, o.total
     FROM deliveries d
     JOIN orders o ON d.order_id = o.id
     WHERE d.staff_id = ?
     ORDER BY d.assigned_at DESC`,
    [staffId]
  );
  return rows as DeliveryRecord[];
}

export async function getAllDeliveries(): Promise<DeliveryRecord[]> {
  const [rows] = await pool.query(`
    SELECT d.*, o.consumer_name, o.consumer_phone, o.consumer_address,
           o.total, s.full_name as staff_name
    FROM deliveries d
    JOIN orders o ON d.order_id = o.id
    JOIN delivery_staff s ON d.staff_id = s.id
    ORDER BY d.assigned_at DESC
  `);
  return rows as DeliveryRecord[];
}

export async function markOutForDelivery(deliveryId: number): Promise<void> {
  await pool.query(
    `UPDATE deliveries SET status = 'out_for_delivery', sms_sent_at = NOW() WHERE id = ?`,
    [deliveryId]
  );
}

export async function markDelivered(
  deliveryId: number,
  autoConfirmed: boolean = false
): Promise<void> {
  const now = new Date();
  if (autoConfirmed) {
    await pool.query(
      `UPDATE deliveries SET status = 'delivered', delivered_at = ?, auto_confirmed_at = ? WHERE id = ?`,
      [now, now, deliveryId]
    );
  } else {
    await pool.query(
      `UPDATE deliveries SET status = 'delivered', delivered_at = ?, sms_confirmed_at = ? WHERE id = ?`,
      [now, now, deliveryId]
    );
  }
}

export async function flagComplaint(
  deliveryId: number,
  complaintType: ComplaintType,
  note: string = ""
): Promise<void> {
  await pool.query(
    `UPDATE deliveries
     SET status = 'complaint', has_complaint = TRUE,
         complaint_type = ?, complaint_note = ?
     WHERE id = ?`,
    [complaintType, note, deliveryId]
  );
}

export async function resolveComplaint(deliveryId: number): Promise<void> {
  await pool.query(
    `UPDATE deliveries
     SET complaint_resolved = TRUE, complaint_resolved_at = NOW(), status = 'delivered', delivered_at = NOW()
     WHERE id = ?`,
    [deliveryId]
  );
}

export async function getUnresolvedComplaints(): Promise<DeliveryRecord[]> {
  const [rows] = await pool.query(`
    SELECT d.*, o.consumer_name, o.consumer_phone, o.consumer_address,
           o.total, s.full_name as staff_name
    FROM deliveries d
    JOIN orders o ON d.order_id = o.id
    JOIN delivery_staff s ON d.staff_id = s.id
    WHERE d.has_complaint = TRUE AND d.complaint_resolved = FALSE
    ORDER BY d.updated_at DESC
  `);
  return rows as DeliveryRecord[];
}

// For auto-confirm: find deliveries where SMS was sent > 1hr ago and not yet confirmed
export async function getExpiredSmsDeliveries(): Promise<DeliveryRecord[]> {
  const [rows] = await pool.query(`
    SELECT * FROM deliveries
    WHERE status = 'out_for_delivery'
      AND sms_sent_at IS NOT NULL
      AND sms_confirmed_at IS NULL
      AND auto_confirmed_at IS NULL
      AND has_complaint = FALSE
      AND sms_sent_at <= DATE_SUB(NOW(), INTERVAL 1 HOUR)
  `);
  return rows as DeliveryRecord[];
}
