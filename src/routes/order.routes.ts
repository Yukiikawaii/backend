import { Router } from "express";
import { placeOrder, listOrders, getOrder, cancelOrder } from "../controllers/order.controller";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.post("/", asyncHandler(placeOrder));
router.get("/", asyncHandler(listOrders));
router.get("/:id", asyncHandler(getOrder));
router.patch("/:id/cancel", asyncHandler(cancelOrder));

export default router;
