import status from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { Request, Response } from "express";
import {
  createShippoOrder,
  getShipdayOrder,
  ParcelService,
  sendParcelToShipday,
} from "./parcel.service";
import config from "../../../config";
import Stripe from "stripe";
import prisma from "../../../shared/prisma";
import { getIO } from "../../../socket";
import { TParcelData } from "../../../types/parcel";

export const stripe = new Stripe(config.stripe_secret_key as string);

const addParcel = catchAsync(async (req: Request & { user?: any }, res) => {
  const parcelData = {
    ...req.body,
    marchentId: req.user.id,
  };

  const result = await ParcelService.addParcel(parcelData);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Parcel Added successfully.",
    data: result,
  });
});
const getAllParcels = catchAsync(async (req: Request & { user?: any }, res) => {
  const result = await ParcelService.getAllParcels(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Parcels Fetched successfully.",
    data: result,
  });
});
const myParcels = catchAsync(async (req: Request & { user?: any }, res) => {
  const result = await ParcelService.myParcels(req.user.id, req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "My Parcels fetched successfully.",
    data: result,
  });
});
const getSingleParcel = catchAsync(
  async (req: Request & { user?: any }, res) => {
    const result = await ParcelService.getSingleParcel(req.params.id);

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Single Parcel fetched successfully.",
      data: result,
    });
  }
);
const deleteParcel = catchAsync(async (req: Request & { user?: any }, res) => {
  const result = await ParcelService.deleteParcel(req.params.id, req.user.id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Parcel deleted successfully.",
    data: result,
  });
});
const changeParcelStatus = catchAsync(
  async (req: Request & { user?: any }, res) => {
    const result = await ParcelService.changeParcelStatus(
      req.params.id,
      req.body
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Parcel status changed successfully.",
      data: result,
    });
  }
);
const calcualteParcelPrice = catchAsync(
  async (req: Request & { user?: any }, res) => {
    const result = await ParcelService.calcualteParcelPrice(req.body);

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Parcel price calculated successfully.",
      data: result,
    });
  }
);

export const handleStripeWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe_webhook_secret!
    );
  } catch (err: any) {
    console.error("❌ Webhook Error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  // ✅ Move usage *after* successful assignment
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const parcelId = session.metadata?.parcelId;
    const email = session.metadata?.email;
    const amountStr = session.metadata?.amount;
    const parcelData = JSON.parse(
      session.metadata?.parcelData || "{}"
    ) as TParcelData;
    // const shippoData = JSON.parse(session.metadata?.shippoData || "{}") as any;
    // console.log("shippoData From Webhook", shippoData);

    const marchentId = session.metadata?.marchentId;

    console.log("parcelDataInWebhook:", parcelData);

    // ✅ Validate required metadata fields
    if (!parcelId || !email || !amountStr || !parcelData) {
      console.warn("❌ Missing metadata in Stripe session:");
      res.status(400).json({ error: "Missing required metadata" });
      return;
    }

    const amount = parseInt(amountStr); // ✅ Convert back to number
    const paymentIntentId = session.payment_intent?.toString() || null;

    try {
      const findShippoOrderData = await prisma.shippoOrder.findFirst({
        where: {
          order_number: `#${parcelId}`,
        },
        include: {
          line_items: true,
        },
      });

      console.log(findShippoOrderData);

      const sendShippoData = {
        to_address: {
          name: findShippoOrderData?.to_name,
          street1: findShippoOrderData?.to_street1,
          city: findShippoOrderData?.to_city,
          state: findShippoOrderData?.to_state,
          zip: findShippoOrderData?.to_zip,
          country: findShippoOrderData?.to_country,
          email: findShippoOrderData?.to_email,
          phone: findShippoOrderData?.to_phone,
        },
        line_items: findShippoOrderData?.line_items,
        order_number: findShippoOrderData?.order_number,
        order_status: findShippoOrderData?.order_status,
        shipping_cost: findShippoOrderData?.shipping_cost,
        shipping_cost_currency: findShippoOrderData?.shipping_cost_currency,
        placed_at: findShippoOrderData?.placed_at,
        shipping_method: findShippoOrderData?.shipping_method,
        total_price: findShippoOrderData?.total_price,
        currency: findShippoOrderData?.currency,
        weight: findShippoOrderData?.total_weight,
        weight_unit: findShippoOrderData?.weight_unit,
      };
      // console.log("shippoDataFromDb", findShippoOrderData);
      console.log("sendToShippo", sendShippoData);

      // ✅ Save Payment
      await prisma.payment.create({
        data: {
          email,
          amount,
          currency: session.currency || "usd",
          stripeSessionId: session.id,
          paymentIntentId,
          status: "succeeded",
          parcelId,
        },
      });

      // ✅ Update Parcel
      const parcelUpdate = await prisma.addParcel.update({
        where: { id: parcelId },
        data: { paymentStatus: "PAID" },
      });

      console.log("parcelUpdateToPaid: ", parcelUpdate);

      const shipdayResponse = await sendParcelToShipday(parcelData);
      console.log("shipdayResponse:", shipdayResponse);

      const shipdayOrderInfo = await getShipdayOrder(parcelId);
      console.log("trakingLink: ", shipdayOrderInfo?.[0].trackingLink);

      if (!shipdayOrderInfo || shipdayOrderInfo.length === 0) {
        throw new Error("Shipday order info not found");
      }

      await createShippoOrder(sendShippoData);

      const shipdayStatus = await prisma.addParcel.update({
        where: { id: parcelId },
        data: {
          shipdayOrderId: shipdayResponse?.orderId,
          trackingLink: shipdayOrderInfo?.[0].trackingLink,
        },
      });

      console.log("shipdayStatus:", shipdayStatus);

      // Step 11: Create Notification
      const notification = await prisma.notification.create({
        data: {
          title: `New parcel from ${marchentId}`,
          parcelId: parcelId,
        },
      });

      // Step 12: Emit Notification
      const io = getIO();
      if (io) {
        io.emit("new-notification", notification);
      } else {
        console.warn("⚠️ Socket.io not initialized. Skipping emit.");
      }

      console.log(`✅ Payment and parcel updated for ${parcelId}`);
    } catch (err) {
      console.error("❌ DB update error in webhook:", err);
    }
  }

  res.status(200).json({ received: true });
};

export const ParcelController = {
  addParcel,
  myParcels,
  getSingleParcel,
  deleteParcel,
  getAllParcels,
  changeParcelStatus,
  handleStripeWebhook,
  calcualteParcelPrice
};
