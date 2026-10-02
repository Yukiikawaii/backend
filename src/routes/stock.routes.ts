import { Router } from "express";
import {
  listStocks,
  listLowStocks,
  adjustStockHandler,
  updateThresholdHandler,
} from "../controllers/stock.controller";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listStocks));
router.get("/low", asyncHandler(listLowStocks));
router.post("/adjust", asyncHandler(adjustStockHandler));
router.post("/threshold", asyncHandler(updateThresholdHandler));

export default router;
