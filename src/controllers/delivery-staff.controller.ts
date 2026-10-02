import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import {
  getAllStaff,
  createStaff,
  toggleStaffActive,
  findStaffByEmail,
  findStaffById,
  getStaffStats,
  getStaffStatById,
} from "../models/delivery-staff.model";
import { getDeliveriesByStaff } from "../models/delivery.model";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

export async function listStaff(_req: Request, res: Response) {
  const staff = await getAllStaff();
  return res.status(200).json({ status: "ok", staff });
}

export async function addStaff(req: Request, res: Response) {
  const { fullName, email, phone, password } = req.body ?? {};

  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ status: "invalid_input", message: "All fields are required." });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ status: "invalid_input", message: "Password must be at least 8 characters." });
  }

  const existing = await findStaffByEmail(String(email).trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ status: "duplicate", message: "A staff account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);
  const id = await createStaff({
    fullName: String(fullName).trim(),
    email: String(email).trim().toLowerCase(),
    phone: String(phone).trim(),
    passwordHash,
  });

  return res.status(201).json({ status: "success", message: "Staff account created.", staffId: id });
}

export async function toggleStaff(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { isActive } = req.body ?? {};

  if (isActive === undefined) {
    return res.status(400).json({ status: "invalid_input", message: "isActive is required." });
  }

  const staff = await findStaffById(id);
  if (!staff) return res.status(404).json({ status: "not_found", message: "Staff not found." });

  await toggleStaffActive(id, Boolean(isActive));
  return res.status(200).json({ status: "success", message: `Staff ${isActive ? "activated" : "deactivated"}.` });
}

export async function staffLogin(req: Request, res: Response) {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ status: "invalid_input", message: "Email and password are required." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const staff = await findStaffByEmail(normalizedEmail);

  const genericInvalid = { status: "invalid_credentials", message: "Incorrect email or password." };
  if (!staff) return res.status(401).json(genericInvalid);

  const matches = await bcrypt.compare(String(password), staff.password_hash);
  if (!matches) return res.status(401).json(genericInvalid);

  if (!staff.is_active) {
    return res.status(403).json({ status: "inactive", message: "Your account has been deactivated." });
  }

  return res.status(200).json({
    status: "success",
    message: "Login successful.",
    staffId: staff.id,
    fullName: staff.full_name,
  });
}

export async function getStaffDeliveries(req: Request, res: Response) {
  const staffId = Number(req.params.id);
  const staff = await findStaffById(staffId);
  if (!staff) return res.status(404).json({ status: "not_found", message: "Staff not found." });

  const deliveries = await getDeliveriesByStaff(staffId);
  const stats = await getStaffStatById(staffId);

  return res.status(200).json({ status: "ok", deliveries, stats });
}

export async function getAllStaffStats(_req: Request, res: Response) {
  const stats = await getStaffStats();
  return res.status(200).json({ status: "ok", stats });
}
