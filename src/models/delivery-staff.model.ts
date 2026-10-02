import { pool } from "../config/db";
import type { StaffRecord, NewStaffInput, StaffDeliveryStats } from "../types";

export async function findStaffByEmail(email: string): Promise<StaffRecord | null> {
  const [rows] = await pool.query(
    "SELECT * FROM delivery_staff WHERE email = ? LIMIT 1",
    [email]
  );
  const records = rows as StaffRecord[];
  return records[0] ?? null;
}

export async function findStaffById(id: number): Promise<StaffRecord | null> {
  const [rows] = await pool.query(
    "SELECT * FROM delivery_staff WHERE id = ? LIMIT 1",
    [id]
  );
  const records = rows as StaffRecord[];
  return records[0] ?? null;
}

export async function getAllStaff(): Promise<StaffRecord[]> {
  const [rows] = await pool.query(
    "SELECT * FROM delivery_staff ORDER BY created_at ASC"
  );
  return rows as StaffRecord[];
}

export async function createStaff(input: NewStaffInput): Promise<number> {
  const [result] = await pool.query(
    `INSERT INTO delivery_staff (full_name, email, phone, password_hash)
     VALUES (?, ?, ?, ?)`,
    [input.fullName, input.email, input.phone, input.passwordHash]
  );
  return (result as { insertId: number }).insertId;
}

export async function toggleStaffActive(id: number, isActive: boolean): Promise<void> {
  await pool.query(
    "UPDATE delivery_staff SET is_active = ? WHERE id = ?",
    [isActive, id]
  );
}

// Round-robin: get the active staff member who was assigned least recently
export async function getNextStaffInRotation(): Promise<StaffRecord | null> {
  const [rows] = await pool.query(`
    SELECT *
    FROM delivery_staff
    WHERE is_active = TRUE
    ORDER BY
      CASE
        WHEN last_assigned_at IS NULL THEN 0
        ELSE 1
      END ASC,
      last_assigned_at ASC,
      id ASC
    LIMIT 1
  `);

  const records = rows as StaffRecord[];

  return records[0] ?? null;
}

export async function updateLastAssigned(staffId: number): Promise<void> {
  await pool.query(
    "UPDATE delivery_staff SET last_assigned_at = NOW() WHERE id = ?",
    [staffId]
  );
}

export async function getStaffStats(): Promise<StaffDeliveryStats[]> {
  const [rows] = await pool.query("SELECT * FROM staff_delivery_stats ORDER BY staff_id ASC");
  return rows as StaffDeliveryStats[];
}

export async function getStaffStatById(staffId: number): Promise<StaffDeliveryStats | null> {
  const [rows] = await pool.query(
    "SELECT * FROM staff_delivery_stats WHERE staff_id = ?",
    [staffId]
  );
  const records = rows as StaffDeliveryStats[];
  return records[0] ?? null;
}
