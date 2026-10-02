import { pool } from "../config/db";
import type { SaleRecord, SaleType } from "../types";

export async function recordSale(
  orderId: number,
  total: number,
  saleType: SaleType
): Promise<void> {
  await pool.query(
    `INSERT INTO sales (order_id, total, sale_type) VALUES (?, ?, ?)`,
    [orderId, total, saleType]
  );
}

export async function getAllSales(): Promise<SaleRecord[]> {
  const [rows] = await pool.query(`
    SELECT s.*, o.consumer_name, o.consumer_phone, o.order_type
    FROM sales s
    JOIN orders o ON s.order_id = o.id
    ORDER BY s.paid_at DESC
  `);
  return rows as SaleRecord[];
}

export async function getSalesByDateRange(from: string, to: string): Promise<SaleRecord[]> {
  const [rows] = await pool.query(`
    SELECT s.*, o.consumer_name, o.consumer_phone, o.order_type
    FROM sales s
    JOIN orders o ON s.order_id = o.id
    WHERE DATE(s.paid_at) BETWEEN ? AND ?
    ORDER BY s.paid_at DESC
  `, [from, to]);
  return rows as SaleRecord[];
}

export async function getSalesSummaryByProduct(): Promise<unknown[]> {
  const [rows] = await pool.query(`
    SELECT p.id, p.label, p.size, p.price,
           COALESCE(SUM(oi.quantity), 0) as total_units,
           COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue
    FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id
    LEFT JOIN sales s ON s.order_id = oi.order_id
    GROUP BY p.id, p.label, p.size, p.price
    ORDER BY p.price ASC
  `);
  return rows as unknown[];
}
