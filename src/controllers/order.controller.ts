import type { Request, Response } from "express";

import {
  createOrder,
  assignStaffToOrder,
  updateOrderStatus,
  getOrderById,
  getAllOrders,
  getOrderItems,
} from "../models/order.model";

import {
  getNextStaffInRotation,
  updateLastAssigned,
} from "../models/delivery-staff.model";

import { createDelivery } from "../models/delivery.model";
import { recordSale } from "../models/sale.model";
import { getAllStocks } from "../models/stock.model";

export async function placeOrder(req: Request, res: Response) {
  const {
    orderType,
    consumerName,
    consumerPhone,
    consumerAddress,
    notes,
    items,
    adminId,
  } = req.body ?? {};

  // DEBUG
  console.log("ORDER TYPE FROM FRONTEND:", orderType);
  console.log("ORDER ITEMS FROM FRONTEND:", items);

  // Validate basic input
  if (
    !orderType ||
    !consumerName ||
    !consumerPhone ||
    !items ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      status: "invalid_input",
      message:
        "Order type, consumer name, phone, and at least one item are required.",
    });
  }

  // Only allow the two valid order types
  if (orderType !== "walk_in" && orderType !== "call") {
    return res.status(400).json({
      status: "invalid_input",
      message: "Invalid order type. Use 'walk_in' or 'call'.",
    });
  }

  // Call orders require a delivery address
  if (orderType === "call" && !consumerAddress) {
    return res.status(400).json({
      status: "invalid_input",
      message: "Delivery address is required for call orders.",
    });
  }

  // --------------------------------------------------
  // CHECK STOCK
  // --------------------------------------------------

  const stocks = await getAllStocks();

  console.log("STOCKS FROM DATABASE:", stocks);

  for (const item of items) {
    const stock = stocks.find(
      (s) => Number(s.product_id) === Number(item.product_id)
    );

    if (!stock) {
      return res.status(400).json({
        status: "invalid_product",
        message: `Product ${item.product_id} does not exist in stock.`,
      });
    }

    if (Number(stock.quantity) < Number(item.quantity)) {
      return res.status(400).json({
        status: "insufficient_stock",
        message: `Insufficient stock for product ${item.product_id}. Available: ${stock.quantity}.`,
      });
    }

    if (Number(item.quantity) <= 0) {
      return res.status(400).json({
        status: "invalid_quantity",
        message: "Item quantity must be greater than 0.",
      });
    }
  }

  // --------------------------------------------------
  // CREATE ORDER
  // --------------------------------------------------

  const orderId = await createOrder(
    {
      orderType,
      consumerName,
      consumerPhone,
      consumerAddress,
      notes,
      items,
    },
    adminId
  );

  console.log("ORDER CREATED:", orderId);
  console.log("ORDER TYPE:", orderType);

  // --------------------------------------------------
  // WALK-IN ORDER
  // --------------------------------------------------

  if (orderType === "walk_in") {
    const order = await getOrderById(orderId);

    if (!order) {
      return res.status(500).json({
        status: "error",
        message: "Order was created but could not be retrieved.",
      });
    }

    // Walk-in orders are immediately completed
    await updateOrderStatus(orderId, "delivered");

    // Record the sale
    await recordSale(orderId, order.total, "walk_in");

    console.log("WALK-IN ORDER COMPLETED:", orderId);

    return res.status(201).json({
      status: "success",
      message: "Walk-in order recorded and sale logged.",
      orderId,
    });
  }

  // --------------------------------------------------
  // CALL / DELIVERY ORDER
  // --------------------------------------------------

  if (orderType === "call") {
    // Find the next available delivery staff
    const staff = await getNextStaffInRotation();

    if (!staff) {
      return res.status(503).json({
        status: "no_staff",
        message: "No active delivery staff available.",
      });
    }

    // Assign staff to order
    await assignStaffToOrder(orderId, staff.id);

    // Update staff rotation
    await updateLastAssigned(staff.id);

    // Create delivery record
    const deliveryId = await createDelivery(orderId, staff.id);

    console.log("DELIVERY CREATED:", {
      orderId,
      deliveryId,
      staffId: staff.id,
      staffName: staff.full_name,
    });

    return res.status(201).json({
      status: "success",
      message: `Order placed and assigned to ${staff.full_name}.`,
      orderId,
      deliveryId,
      assignedStaff: {
        id: staff.id,
        fullName: staff.full_name,
      },
    });
  }

  // This should never happen because we validate orderType above
  return res.status(400).json({
    status: "invalid_input",
    message: "Unsupported order type.",
  });
}

// --------------------------------------------------
// GET ALL ORDERS
// --------------------------------------------------

export async function listOrders(_req: Request, res: Response) {
  const orders = await getAllOrders();

  return res.status(200).json({
    status: "ok",
    orders,
  });
}

// --------------------------------------------------
// GET SINGLE ORDER
// --------------------------------------------------

export async function getOrder(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      status: "invalid_id",
      message: "Invalid order ID.",
    });
  }

  const order = await getOrderById(id);

  if (!order) {
    return res.status(404).json({
      status: "not_found",
      message: "Order not found.",
    });
  }

  const items = await getOrderItems(id);

  return res.status(200).json({
    status: "ok",
    order,
    items,
  });
}

// --------------------------------------------------
// CANCEL ORDER
// --------------------------------------------------

export async function cancelOrder(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      status: "invalid_id",
      message: "Invalid order ID.",
    });
  }

  const order = await getOrderById(id);

  if (!order) {
    return res.status(404).json({
      status: "not_found",
      message: "Order not found.",
    });
  }

  if (order.status === "delivered") {
    return res.status(400).json({
      status: "invalid_state",
      message: "Cannot cancel a delivered order.",
    });
  }

  if (order.status === "cancelled") {
    return res.status(400).json({
      status: "invalid_state",
      message: "Order is already cancelled.",
    });
  }

  await updateOrderStatus(id, "cancelled");

  return res.status(200).json({
    status: "success",
    message: "Order cancelled.",
  });
}