import type { Request, Response } from "express";

import {
  getAllDeliveries,
  getDeliveryById,
  markOutForDelivery,
  markDelivered,
  flagComplaint,
  resolveComplaint,
  getUnresolvedComplaints,
  getDeliveriesByStaff,
} from "../models/delivery.model";

import {
  updateOrderStatus,
  getOrderById,
} from "../models/order.model";

import { recordSale } from "../models/sale.model";

import {
  sendSms,
  buildDeliveryConfirmationMessage,
} from "../services/sms.service";

import type { ComplaintType } from "../types";

// --------------------------------------------------
// GET ALL DELIVERIES
// --------------------------------------------------

export async function listDeliveries(
  _req: Request,
  res: Response
) {
  const deliveries = await getAllDeliveries();

  return res.status(200).json({
    status: "ok",
    deliveries,
  });
}

// --------------------------------------------------
// GET UNRESOLVED COMPLAINTS
// --------------------------------------------------

export async function listComplaints(
  _req: Request,
  res: Response
) {
  const complaints = await getUnresolvedComplaints();

  return res.status(200).json({
    status: "ok",
    complaints,
  });
}

// --------------------------------------------------
// GET DELIVERIES FOR STAFF
// --------------------------------------------------

export async function staffListDeliveries(
  req: Request,
  res: Response
) {
  const staffId = Number(req.params.staffId);

  if (!Number.isInteger(staffId) || staffId <= 0) {
    return res.status(400).json({
      status: "invalid_id",
      message: "Invalid staff ID.",
    });
  }

  const deliveries = await getDeliveriesByStaff(staffId);

  return res.status(200).json({
    status: "ok",
    deliveries,
  });
}

// --------------------------------------------------
// DISPATCH DELIVERY
// --------------------------------------------------

export async function dispatchDelivery(
  req: Request,
  res: Response
) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      status: "invalid_id",
      message: "Invalid delivery ID.",
    });
  }

  const delivery = await getDeliveryById(id);

  if (!delivery) {
    return res.status(404).json({
      status: "not_found",
      message: "Delivery not found.",
    });
  }

  // Make sure this delivery is still assigned
  if (delivery.status !== "assigned") {
    return res.status(400).json({
      status: "invalid_state",
      message: `Delivery cannot be dispatched because its current status is '${delivery.status}'.`,
    });
  }

  // Get the order first
  const order = await getOrderById(delivery.order_id);

  if (!order) {
    return res.status(404).json({
      status: "not_found",
      message: "Associated order not found.",
    });
  }

  // --------------------------------------------------
  // CHANGE DELIVERY STATUS
  // assigned → out_for_delivery
  // --------------------------------------------------

  await markOutForDelivery(id);

  // --------------------------------------------------
  // CHANGE ORDER STATUS
  // confirmed → out_for_delivery
  // --------------------------------------------------

  await updateOrderStatus(
    delivery.order_id,
    "out_for_delivery"
  );

  // --------------------------------------------------
  // SEND SMS
  // --------------------------------------------------

  let smsMessage = "Delivery dispatched successfully.";

  try {
    const message = buildDeliveryConfirmationMessage(
      order.total
    );

    await sendSms(
      order.consumer_phone,
      message,
      order.id,
      id
    );

    smsMessage = "Delivery dispatched and SMS sent.";

    console.log(
      `SMS successfully sent for delivery #${id}`
    );
  } catch (error) {
    // SMS failure should NOT cancel the delivery dispatch.
    console.error(
      `SMS failed for delivery #${id}:`,
      error
    );

    smsMessage =
      "Delivery dispatched";
  }

  return res.status(200).json({
    status: "success",
    message: smsMessage,
  });
}

// --------------------------------------------------
// CONFIRM DELIVERY
// --------------------------------------------------

export async function confirmDelivery(
  req: Request,
  res: Response
) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      status: "invalid_id",
      message: "Invalid delivery ID.",
    });
  }

  const delivery = await getDeliveryById(id);

  if (!delivery) {
    return res.status(404).json({
      status: "not_found",
      message: "Delivery not found.",
    });
  }

  if (delivery.status !== "out_for_delivery") {
    return res.status(400).json({
      status: "invalid_state",
      message:
        "Delivery must be out for delivery before it can be confirmed.",
    });
  }

  // out_for_delivery → delivered
  await markDelivered(id, false);

  // Update order
  await updateOrderStatus(
    delivery.order_id,
    "delivered"
  );

  // Record sale
  const order = await getOrderById(
    delivery.order_id
  );

  if (order) {
    await recordSale(
      order.id,
      order.total,
      "delivery"
    );
  }

  return res.status(200).json({
    status: "success",
    message: "Delivery confirmed and sale recorded.",
  });
}

// --------------------------------------------------
// FILE COMPLAINT
// --------------------------------------------------

export async function fileComplaint(
  req: Request,
  res: Response
) {
  const id = Number(req.params.id);

  const { complaintType, note } = req.body ?? {};

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      status: "invalid_id",
      message: "Invalid delivery ID.",
    });
  }

  if (!complaintType) {
    return res.status(400).json({
      status: "invalid_input",
      message: "Complaint type is required.",
    });
  }

  const delivery = await getDeliveryById(id);

  if (!delivery) {
    return res.status(404).json({
      status: "not_found",
      message: "Delivery not found.",
    });
  }

  await flagComplaint(
    id,
    complaintType as ComplaintType,
    note ?? ""
  );

  return res.status(200).json({
    status: "success",
    message: "Complaint filed. Admin has been notified.",
  });
}

// --------------------------------------------------
// RESOLVE COMPLAINT
// --------------------------------------------------

export async function resolveDeliveryComplaint(
  req: Request,
  res: Response
) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      status: "invalid_id",
      message: "Invalid delivery ID.",
    });
  }

  const delivery = await getDeliveryById(id);

  if (!delivery) {
    return res.status(404).json({
      status: "not_found",
      message: "Delivery not found.",
    });
  }

  await resolveComplaint(id);

  const order = await getOrderById(
    delivery.order_id
  );

  if (order) {
    await recordSale(
      order.id,
      order.total,
      "delivery"
    );
  }

  return res.status(200).json({
    status: "success",
    message: "Complaint resolved and sale recorded.",
  });
}