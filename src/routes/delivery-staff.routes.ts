import { Router } from "express";
import {
  listStaff,
  addStaff,
  toggleStaff,
  staffLogin,
  getStaffDeliveries,
  getAllStaffStats,
} from "../controllers/delivery-staff.controller";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.post("/login", asyncHandler(staffLogin));
router.get("/", asyncHandler(listStaff));
router.post("/", asyncHandler(addStaff));
router.patch("/:id/toggle", asyncHandler(toggleStaff));
router.get("/stats", asyncHandler(getAllStaffStats));
router.get("/:id/deliveries", asyncHandler(getStaffDeliveries));

export default router;
