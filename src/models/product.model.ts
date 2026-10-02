import { pool } from "../config/db";
import type { ProductRecord, StockWithProduct } from "../types";

export async function getAllProducts(): Promise<ProductRecord[]> {
  const [rows] = await pool.query("SELECT * FROM products ORDER BY price ASC");
  return rows as ProductRecord[];
}

export async function getAllStocksWithProducts(): Promise<StockWithProduct[]> {
  const [rows] = await pool.query(`
    SELECT s.*, p.label, p.size, p.price
    FROM stocks s
    JOIN products p ON s.product_id = p.id
    ORDER BY p.price ASC
  `);
  return rows as StockWithProduct[];
}
