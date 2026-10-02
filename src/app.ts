import express from "express";
import cors from "cors";
import adminRoutes from "./routes/admin.routes";
import orderRoutes from "./routes/order.routes";
import deliveryRoutes from "./routes/delivery.routes";
import stockRoutes from "./routes/stock.routes";
import saleRoutes from "./routes/sale.routes";
import staffRoutes from "./routes/delivery-staff.routes";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
    })
  );
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/admin", adminRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/deliveries", deliveryRoutes);
  app.use("/api/stocks", stockRoutes);
  app.use("/api/sales", saleRoutes);
  app.use("/api/staff", staffRoutes);

  app.use(errorHandler);

  return app;
}
