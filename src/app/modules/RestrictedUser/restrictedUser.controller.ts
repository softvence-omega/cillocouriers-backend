import { Request } from "express";
import catchAsync from "../../../shared/catchAsync";
import { RestrictedUserService } from "./restrictedUser.service";
import sendResponse from "../../../shared/sendResponse";
import status from "http-status";

const addRestrictedUser = catchAsync(
  async (req: Request & { user?: any }, res) => {
    const restrictedUserData = {
      ...req.body,
      marchentId: req.user.id,
    };

    const result = await RestrictedUserService.addRestrictedUser(
      restrictedUserData
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Restricted User Added successfully.",
      data: result,
    });
  }
);
const getAllRestrictedUser = catchAsync(
  async (req: Request & { user?: any }, res) => {
    const result = await RestrictedUserService.getAllRestrictedUser(
      req.user.id,
      req.query
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Restricted Users retrieved successfully.",
      data: result,
    });
  }
);
const getSingleRestrictedUser = catchAsync(
  async (req: Request & { user?: any }, res) => {
    const result = await RestrictedUserService.getSingleRestrictedUser(
      req.params.id,
      req.user.id
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Restricted User retrieved successfully.",
      data: result,
    });
  }
);
const deleteRestrictedUser = catchAsync(
  async (req: Request & { user?: any }, res) => {
    const result = await RestrictedUserService.deleteRestrictedUser(
      req.params.id,
      req.user.id
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Restricted User deleted successfully.",
      data: result,
    });
  }
);



export const restrictedUserController = {
  addRestrictedUser,
  getAllRestrictedUser,
  getSingleRestrictedUser,
  deleteRestrictedUser
};
