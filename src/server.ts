
import { Server as HTTPServer } from "http";
import app from "./app";
import { initParcelService, updateOrdersFromShipday } from "./app/modules/Parcel/parcel.service";
import { initSocket } from "./socket";
import cron from "node-cron";

const port = 5000;

async function main() {
  const httpServer: HTTPServer = app.listen(port, () => {
    console.log("🚀 UUING Courier Service is running on port", port);
  });
  const io = initSocket(httpServer); // ✅ init socket server
  initParcelService(io);         
  
  cron.schedule("*/5 * * * *", async () => {
    // console.log("Running Shipday polling job...");
    try {
      await updateOrdersFromShipday();
      // console.log("Shipday polling job finished.");
    } catch (error) {
      // console.error("Shipday polling job failed:", error);
    }
  });// ✅ send to service
}

main();
