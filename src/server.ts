import { Server } from "http";
import app from "./app";
import { startNotificationCron } from "./helpers/notification.cron";

// const port = 3000;
const port = 5000;

async function main() {
  const server: Server = app.listen(port, () => {
    console.log("UUING Curier Service is running on port ", port);
    startNotificationCron()
  });
}

main();
