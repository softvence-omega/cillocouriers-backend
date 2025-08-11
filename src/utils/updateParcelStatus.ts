import cron from "node-cron";
import { updateOrdersFromShipday } from "../app/modules/Parcel/parcel.service";

// প্রতি ৫ মিনিটে একবার রান করবে
cron.schedule("*/5 * * * * *", async () => {
//   console.log("Running Shipday polling job...");
  try {
    await updateOrdersFromShipday();
    // console.log("Shipday polling job finished.");
  } catch (error) {
    console.error("Shipday polling job failed:", error);
  }
});
