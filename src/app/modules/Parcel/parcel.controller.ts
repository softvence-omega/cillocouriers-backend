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
    const result = await ParcelService.getSingleParcel(
      req.params.id,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Single Parcel fetched successfully.",
      data: result,
    });
  }
);
const deleteParcel = catchAsync(
  async (req: Request & { user?: any }, res) => {
    const result = await ParcelService.deleteParcel(
      req.params.id,
      req.user.id
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Parcel deleted successfully.",
      data: result,
    });
  }
);
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

export const ParcelController = {
  addParcel,
  myParcels,
  getSingleParcel,
  deleteParcel,
  getAllParcels,
  changeParcelStatus
};
