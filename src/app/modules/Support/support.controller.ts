import { Request } from "express";
import catchAsync from "../../../shared/catchAsync";
import { SupportService } from "./support.service";
import sendResponse from "../../../shared/sendResponse";
import status from "http-status";

const addSupport = catchAsync(async (req: Request & { user?: any }, res) => {
  // Form-data te data field a stringified JSON ashe
  const parsedData = JSON.parse(req.body.data); // parse JSON string
  const supportData = {
    ...parsedData, // title, description, category
    marchentId: req.user?.id,
  };

  const result = await SupportService.addSupport(supportData);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Support Added successfully.",
    data: result,
  });
});

const mySupportRequests = catchAsync(
  async (req: Request & { user?: any }, res) => {
    const result = await SupportService.mySupportRequests(
      req.user?.id,
      req.query
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Support requests fetched successfully.",
      data: result,
    });
  }
);

export const SupportController = {
  addSupport,
  mySupportRequests,
};
