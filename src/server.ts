import "dotenv/config";
import { createApp } from "./app";
import { startDeliveryTimerService } from "./services/delivery-timer.service";

const PORT = Number(process.env.PORT ?? 4000);

const app = createApp();

app.listen(PORT, () => {
  console.log(`Aqua Grace backend listening on http://localhost:${PORT}`);
  startDeliveryTimerService();
});
