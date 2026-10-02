import type { Request, Response } from "express";
import { getAllSales, getSalesByDateRange, getSalesSummaryByProduct } from "../models/sale.model";

export async function listSales(req: Request, res: Response) {
  const { from, to } = req.query;

  let sales;
  if (from && to) {
    sales = await getSalesByDateRange(String(from), String(to));
  } else {
    sales = await getAllSales();
  }

  return res.status(200).json({ status: "ok", sales });
}

export async function getSalesSummary(_req: Request, res: Response) {
  const summary = await getSalesSummaryByProduct();
  return res.status(200).json({ status: "ok", summary });
}
