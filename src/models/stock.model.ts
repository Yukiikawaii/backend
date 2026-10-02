
import { pool } from "../config/db";

import type {
  StockRecord,
  StockWithProduct,
} from "../types";

// --------------------------------------------------
// GET STOCK BY PRODUCT
// --------------------------------------------------

export async function getStockByProduct(
  productId: number
): Promise<StockRecord | null> {
  const [rows] = await pool.query(
    "SELECT * FROM stocks WHERE product_id = ? LIMIT 1",
    [productId]
  );

  const records = rows as StockRecord[];

  return records[0] ?? null;
}

// --------------------------------------------------
// ADJUST STOCK
// --------------------------------------------------

export async function adjustStock(
  productId: number,
  adminId: number,
  type: "add" | "subtract",
  quantity: number
): Promise<void> {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Make sure the stock record exists
    const [stockRows] = await conn.query(
      "SELECT id, quantity FROM stocks WHERE product_id = ? LIMIT 1",
      [productId]
    );

    const stocks = stockRows as {
      id: number;
      quantity: number;
    }[];

    if (stocks.length === 0) {
      throw new Error(
        `No stock record found for product ID ${productId}`
      );
    }

    // Make sure quantity is valid
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(
        "Stock quantity must be a positive whole number."
      );
    }

    const delta =
      type === "add"
        ? quantity
        : -quantity;

    // Prevent subtracting more stock than available
    if (
      type === "subtract" &&
      stocks[0].quantity < quantity
    ) {
      throw new Error(
        `Not enough stock. Current stock: ${stocks[0].quantity}`
      );
    }

    // Update stock quantity
    await conn.query(
      `
      UPDATE stocks
      SET quantity = quantity + ?
      WHERE product_id = ?
      `,
      [delta, productId]
    );

    // Record the adjustment
    await conn.query(
      `
      INSERT INTO stock_adjustments
        (product_id, admin_id, adjustment_type, quantity)
      VALUES (?, ?, ?, ?)
      `,
      [
        productId,
        adminId,
        type,
        quantity,
      ]
    );

    await conn.commit();

  } catch (error) {
    await conn.rollback();

    console.error(
      "ADJUST STOCK MODEL ERROR:",
      error
    );

    throw error;

  } finally {
    conn.release();
  }
}

// --------------------------------------------------
// GET LOW STOCKS
// --------------------------------------------------

export async function getLowStockItems(): Promise<
  StockWithProduct[]
> {
  const [rows] = await pool.query(`
    SELECT
      s.*,
      p.label,
      p.size,
      p.price
    FROM stocks s
    JOIN products p
      ON s.product_id = p.id
    WHERE s.quantity <= s.threshold
    ORDER BY s.quantity ASC
  `);

  return rows as StockWithProduct[];
}

// --------------------------------------------------
// GET ALL STOCKS
// --------------------------------------------------

export async function getAllStocks(): Promise<
  StockWithProduct[]
> {
  const [rows] = await pool.query(`
    SELECT
      s.*,
      p.label,
      p.size,
      p.price
    FROM stocks s
    JOIN products p
      ON s.product_id = p.id
    ORDER BY p.price ASC
  `);

  return rows as StockWithProduct[];
}

// --------------------------------------------------
// UPDATE THRESHOLD
// --------------------------------------------------

export async function updateThreshold(
  productId: number,
  threshold: number
): Promise<void> {
  await pool.query(
    `
    UPDATE stocks
    SET threshold = ?
    WHERE product_id = ?
    `,
    [threshold, productId]
  );
}
