import { pool } from "../config/db";
import type { AdminRecord } from "../types";

export async function findAdminByEmail(email: string): Promise<AdminRecord | null> {
  const [rows] = await pool.query(
    "SELECT * FROM admins WHERE email = ? LIMIT 1",
    [email]
  );
  const records = rows as AdminRecord[];
  return records[0] ?? null;
}

export async function findAdminById(id: number): Promise<AdminRecord | null> {
  const [rows] = await pool.query(
    "SELECT * FROM admins WHERE id = ? LIMIT 1",
    [id]
  );
  const records = rows as AdminRecord[];
  return records[0] ?? null;
}

export async function updateAdminPassword(id: number, passwordHash: string): Promise<void> {
  await pool.query(
    "UPDATE admins SET password_hash = ? WHERE id = ?",
    [passwordHash, id]
  );
}
