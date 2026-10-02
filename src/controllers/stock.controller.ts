import type { Request, Response } from "express";
import { getAllStocks, adjustStock, updateThreshold, getLowStockItems } from "../models/stock.model";

export async function listStocks(_req: Request, res: Response) {
  const stocks = await getAllStocks();
  return res.status(200).json({ status: "ok", stocks });
}

export async function listLowStocks(_req: Request, res: Response) {
  const items = await getLowStockItems();
  return res.status(200).json({ status: "ok", items });
}

export async function adjustStockHandler(req: Request, res: Response) {
  const { productId, type, quantity, adminId } = req.body ?? {};

  if (!productId || !type || !quantity || !adminId) {
    return res.status(400).json({ status: "invalid_input", message: "productId, type, quantity, and adminId are required." });
  }

  if (!["add", "subtract"].includes(type)) {
    return res.status(400).json({ status: "invalid_input", message: "type must be 'add' or 'subtract'." });
  }

await adjustStock(Number(productId), Number(adminId), type, Number(quantity));
  return res.status(200).json({ status: "success", message: `Stock ${type === "add" ? "added" : "subtracted"} successfully.` });
}

export async function updateThresholdHandler(req: Request, res: Response) {
  const { productId, threshold } = req.body ?? {};

  if (!productId || threshold === undefined) {
    return res.status(400).json({ status: "invalid_input", message: "productId and threshold are required." });
  }

  await updateThreshold(Number(productId), Number(threshold));
  return res.status(200).json({ status: "success", message: "Threshold updated." });
}
