import { Router } from "express";
import { listSales, getSalesSummary } from "../controllers/sale.controller";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listSales));
router.get("/summary", asyncHandler(getSalesSummary));

export default router;
