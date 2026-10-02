import "dotenv/config";

console.log("🔥 SERVER.TS LOADED");

import { createApp } from "./app";
import { startDeliveryTimerService } from "./services/delivery-timer.service";

const PORT = Number(process.env.PORT ?? 4000);

const app = createApp();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Aqua Grace backend listening on port ${PORT}`);
  startDeliveryTimerService();
});
