import { Router } from "express";
import { adminLogin, getDashboardOverview, changePassword } from "../controllers/admin.controller";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.post("/login", asyncHandler(adminLogin));
router.get("/dashboard", asyncHandler(getDashboardOverview));
router.post("/change-password", asyncHandler(changePassword));

export default router;
