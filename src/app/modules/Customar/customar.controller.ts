import status from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { Request } from "express";
import { customarService } from "./customar.service";

const addCustomer = catchAsync(async (req: Request & { user?: any }, res) => {
  const customerData = {
    ...req.body,
    marchentId: req.user.id,
  };
  const result = await customarService.addCustomer(customerData);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Customar Added successfully.",
    data: result,
  });
});
const updateCustomer = catchAsync(
  async (req: Request & { user?: any }, res) => {
    const result = await customarService.updateCustomar(
      req.params.id,
      req.user.id,
      req.body
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Customer Updated successfully.",
      data: result,
    });
  }
);
const deleteCustomer = catchAsync(
  async (req: Request & { user?: any }, res) => {
    const result = await customarService.deleteCustomar(
      req.params.id,
      req.user.id
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Customer Deleted successfully.",
      data: result,
    });
  }
);
const getMySelfCustomers = catchAsync(
  async (req: Request & { user?: any }, res) => {
    const result = await customarService.getMySelfCustomers(
      req.user.id,
      req.query
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "My Customers Fetched successfully.",
      data: result,
    });
  }
);
const getSingleCustomer = catchAsync(
  async (req: Request & { user?: any }, res) => {
    const result = await customarService.getSingleCustomer(
      req.params.id,
      req.user.id
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Single Customer Fetched successfully.",
      data: result,
    });
  }
);

export const customarController = {
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getMySelfCustomers,
  getSingleCustomer,
};
