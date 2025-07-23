import { Request } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import status from "http-status";
import { paymentMethodService } from "./paymentMethod.service";

const addPaymentMethod = catchAsync(
  async (req: Request & { user?: any }, res) => {
    const paymentMethodData = {
      ...req.body,
      marchentId: req.user.id,
    };

    const result = await paymentMethodService.addPaymentMethod(paymentMethodData);

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Payment Method Added successfully.",
      data: result,
    });
  }
);
const getMyPaymentMethods = catchAsync(
  async (req: Request & { user?: any }, res) => {
    
    const result = await paymentMethodService.getMyPaymentMethods(req.user.id);

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Myself Payment Methods Fetched successfully.",
      data: result,
    });
  }
);
const deletePaymentMethod = catchAsync(
  async (req: Request & { user?: any }, res) => {
    
    const result = await paymentMethodService.deletePaymentMethod(req.params.id, req.user.id);

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Payment Method Deleted successfully.",
      data: result,
    });
  }
);



export const paymentMethodController = {
  addPaymentMethod,
  getMyPaymentMethods,
  deletePaymentMethod
};
