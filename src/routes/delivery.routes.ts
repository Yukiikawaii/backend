import { Router } from "express";
import {
  listDeliveries,
  listComplaints,
  staffListDeliveries,
  dispatchDelivery,
  confirmDelivery,
  fileComplaint,
  resolveDeliveryComplaint,
} from "../controllers/delivery.controller";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listDeliveries));
router.get("/complaints", asyncHandler(listComplaints));
router.get("/staff/:staffId", asyncHandler(staffListDeliveries));
router.patch("/:id/dispatch", asyncHandler(dispatchDelivery));
router.patch("/:id/confirm", asyncHandler(confirmDelivery));
router.post("/:id/complaint", asyncHandler(fileComplaint));
router.patch("/:id/resolve", asyncHandler(resolveDeliveryComplaint));

export default router;
