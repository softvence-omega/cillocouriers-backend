// import { Server } from "http";
// import app from "./app";
// import { startNotificationCron } from "./helpers/notification.cron";

// // const port = 3000;
// const port = 5000;

// async function main() {
//   const server: Server = app.listen(port, () => {
//     console.log("UUING Curier Service is running on port ", port);
//     startNotificationCron()
//   });
// }

// main();



import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { initParcelService } from "./app/modules/Parcel/parcel.service";
import { initSocket } from "./socket";

const port = 5000;

async function main() {
  const httpServer: HTTPServer = app.listen(port, () => {
    console.log("🚀 UUING Courier Service is running on port", port);
  });

  const io = initSocket(httpServer); // ✅ init socket server
  initParcelService(io);             // ✅ send to service
}

main();
