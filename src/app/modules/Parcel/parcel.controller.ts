import status from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { Request } from "express";
import { ParcelService } from "./parcel.service";

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

export const ParcelController = {
  addParcel,
};
