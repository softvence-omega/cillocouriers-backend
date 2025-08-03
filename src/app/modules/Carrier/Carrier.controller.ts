import { Request } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import status from "http-status";
import { CarrierService } from "./Carrier.service";

const addCarrier = catchAsync(async (req: Request & { user?: any }, res) => {
  const result = await CarrierService.addCarrier(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Carrier Added successfully.",
    data: result,
  });
});
const getCarriers = catchAsync(async (req: Request & { user?: any }, res) => {
  const result = await CarrierService.getCarriers();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Carrier Fetched successfully.",
    data: result,
  });
});
const assignOrderToCarrier = catchAsync(
  async (req: Request & { user?: any }, res) => {
    const { orderId, carrierId } = req.body;

    if (!orderId || !carrierId) {
      res.status(status.BAD_REQUEST).json({
        success: false,
        message: "orderId and carrierId are required.",
      });
      return; // এখানে শুধু return দিলে TypeScript ঠিক থাকে
    }

    const result = await CarrierService.assignOrderToCarrier(
      orderId,
      carrierId
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Order Assigned successfully.",
      data: result,
    });
  }
);
const unassignOrderToCarrier = catchAsync(
  async (req: Request & { user?: any }, res) => {
    const { orderId } = req.body;

    if (!orderId) {
      res.status(status.BAD_REQUEST).json({
        success: false,
        message: "orderId is required.",
      });
      return; // এখানে শুধু return দিলে TypeScript ঠিক থাকে
    }

    const result = await CarrierService.unassignOrderToCarrier(
      orderId
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Order Unassigned successfully.",
      data: result,
    });
  }
);


export const CarrierController = {
  addCarrier,
  getCarriers,
  assignOrderToCarrier,
  unassignOrderToCarrier
};
