import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { findAdminByEmail } from "../models/admin.model";
import {
  getTodayOrderCount,
  getPendingDeliveryCount,
  getTodaySalesTotal,
} from "../models/order.model";
import { getLowStockItems } from "../models/stock.model";
import { getStaffStats } from "../models/delivery-staff.model";
import { getUnresolvedComplaints } from "../models/delivery.model";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

export async function adminLogin(req: Request, res: Response) {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ status: "invalid_input", message: "Email and password are required." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const admin = await findAdminByEmail(normalizedEmail);

  const genericInvalid = { status: "invalid_credentials", message: "Incorrect email or password." };

  if (!admin) return res.status(401).json(genericInvalid);

  const passwordMatches = await bcrypt.compare(String(password), admin.password_hash);
  if (!passwordMatches) return res.status(401).json(genericInvalid);

  if (!admin.is_active) {
    return res.status(403).json({ status: "inactive", message: "This admin account has been deactivated." });
  }

  return res.status(200).json({
    status: "success",
    message: "Login successful.",
    adminId: admin.id,
    fullName: admin.full_name,
  });
}

export async function getDashboardOverview(_req: Request, res: Response) {
  const [ordersToday, pendingDeliveries, lowStock, salesToday, complaints, staffStats] =
    await Promise.all([
      getTodayOrderCount(),
      getPendingDeliveryCount(),
      getLowStockItems(),
      getTodaySalesTotal(),
      getUnresolvedComplaints(),
      getStaffStats(),
    ]);

  return res.status(200).json({
    status: "ok",
    ordersToday,
    pendingDeliveries,
    lowStockCount: lowStock.length,
    lowStockItems: lowStock,
    salesToday,
    unresolvedComplaints: complaints.length,
    complaints,
    staffStats,
  });
}

export async function changePassword(req: Request, res: Response) {
  const { adminId, currentPassword, newPassword } = req.body ?? {};

  if (!adminId || !currentPassword || !newPassword) {
    return res.status(400).json({ status: "invalid_input", message: "All fields are required." });
  }

  const { findAdminById } = await import("../models/admin.model");
  const admin = await findAdminById(Number(adminId));
  if (!admin) return res.status(404).json({ status: "not_found", message: "Admin not found." });

  const matches = await bcrypt.compare(String(currentPassword), admin.password_hash);
  if (!matches) return res.status(401).json({ status: "invalid_credentials", message: "Current password is incorrect." });

  if (String(newPassword).length < 8) {
    return res.status(400).json({ status: "invalid_input", message: "New password must be at least 8 characters." });
  }

  const newHash = await bcrypt.hash(String(newPassword), SALT_ROUNDS);
  const { updateAdminPassword } = await import("../models/admin.model");
  await updateAdminPassword(Number(adminId), newHash);

  return res.status(200).json({ status: "success", message: "Password updated successfully." });
}
