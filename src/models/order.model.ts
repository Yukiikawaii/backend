
import { pool } from "../config/db";
import type { OrderRecord, NewOrderInput, OrderItem } from "../types";

export async function createOrder(
  input: NewOrderInput,
  _adminId: number
): Promise<number> {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Compute total
    const total = input.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const [result] = await conn.query(
      `INSERT INTO orders
        (order_type, consumer_name, consumer_phone, consumer_address, assigned_staff_id, total, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.orderType,
        input.consumerName,
        input.consumerPhone,
        input.consumerAddress ?? null,
        null,
        total,
        input.notes ?? null,
      ]
    );

    const orderId = (result as { insertId: number }).insertId;

    // Insert order items
    for (const item of input.items) {
      await conn.query(
        `INSERT INTO order_items
          (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price]
      );

      // Deduct from stock
      await conn.query(
        `UPDATE stocks
         SET quantity = GREATEST(0, quantity - ?)
         WHERE product_id = ?`,
        [item.quantity, item.product_id]
      );
    }

    await conn.commit();

    return orderId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function assignStaffToOrder(
  orderId: number,
  staffId: number
): Promise<void> {
  await pool.query(
    "UPDATE orders SET assigned_staff_id = ?, status = 'confirmed' WHERE id = ?",
    [staffId, orderId]
  );
}

export async function updateOrderStatus(
  orderId: number,
  status: string
): Promise<void> {
  await pool.query(
    "UPDATE orders SET status = ? WHERE id = ?",
    [status, orderId]
  );
}

export async function getOrderById(
  id: number
): Promise<OrderRecord | null> {
  const [rows] = await pool.query(
    "SELECT * FROM orders WHERE id = ? LIMIT 1",
    [id]
  );

  const records = rows as OrderRecord[];

  return records[0] ?? null;
}

export async function getAllOrders(): Promise<OrderRecord[]> {
  const [rows] = await pool.query(
    "SELECT * FROM orders ORDER BY placed_at DESC"
  );

  return rows as OrderRecord[];
}

export async function getOrderItems(
  orderId: number
): Promise<OrderItem[]> {
  const [rows] = await pool.query(
    `SELECT oi.*, p.label, p.size
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  return rows as OrderItem[];
}

export async function getTodayOrderCount(): Promise<number> {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count
     FROM orders
     WHERE DATE(placed_at) = CURDATE()`
  );

  return (rows as { count: number }[])[0].count;
}

export async function getPendingDeliveryCount(): Promise<number> {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count
     FROM deliveries
     WHERE status IN ('assigned', 'out_for_delivery')`
  );

  return (rows as { count: number }[])[0].count;
}

export async function getTodaySalesTotal(): Promise<number> {
  const [rows] = await pool.query(
    `SELECT COALESCE(SUM(total), 0) as total
     FROM sales
     WHERE DATE(paid_at) = CURDATE()`
  );

  return (rows as { total: number }[])[0].total;
}

