import {
  getExpiredSmsDeliveries,
  markDelivered,
} from "../models/delivery.model";
import { updateOrderStatus } from "../models/order.model";
import { recordSale } from "../models/sale.model";
import { getOrderById } from "../models/order.model";

/**
 * Runs every 5 minutes. Auto-confirms deliveries where:
 * - SMS was sent
 * - No consumer reply in 1 hour
 * - No complaint filed
 */
export async function runAutoConfirmJob(): Promise<void> {
  try {
    const expired = await getExpiredSmsDeliveries();

    for (const delivery of expired) {
      await markDelivered(delivery.id, true);
      await updateOrderStatus(delivery.order_id, "delivered");

      const order = await getOrderById(delivery.order_id);
      if (order) {
        await recordSale(order.id, order.total, "delivery");
      }

      console.log(`[auto-confirm] Delivery #${delivery.id} auto-confirmed for Order #${delivery.order_id}`);
    }
  } catch (err) {
    console.error("[auto-confirm] Job failed:", err);
  }
}

/**
 * Starts the auto-confirm polling loop (every 5 minutes).
 */
export function startDeliveryTimerService(): void {
  console.log("[delivery-timer] Auto-confirm job started — polling every 5 minutes.");
  setInterval(runAutoConfirmJob, 5 * 60 * 1000);
  // Run once immediately on startup
  runAutoConfirmJob();
}
