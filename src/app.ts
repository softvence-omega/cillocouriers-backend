import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";

import router from "./app/routes";
import status from "http-status";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import cookieParser from "cookie-parser";
import { ParcelController } from "./app/modules/Parcel/parcel.controller";
// import { ParcelController } from "./app/modules/Parcel/parcel.controller";

const app: Application = express();
app.post(
  "/api/v1/payment/webhook",
  express.raw({ type: "application/json" }),
  ParcelController.handleStripeWebhook
);
// app.use(
//   cors({
//     origin: ["http://localhost:5173", "https://unnig-courier.vercel.app"],
//     credentials: true,
//   })
// );
app.use(cors());

app.use(cookieParser());

// parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use(globalErrorHandler);

app.get("/", (req: Request, res: Response) => {
  res.send("UUING Curier Service Server is running");
});

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(status.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND",
    error: {
      path: req.originalUrl,
      message: "Your requested path is not found",
    },
  });
});

export default app;
