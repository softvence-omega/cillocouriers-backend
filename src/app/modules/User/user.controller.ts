import status from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { UserDataServices } from "./user.service";
import { Request } from "express";

const getAllUsers = catchAsync(async (req, res) => {
  const result = await UserDataServices.getAllUsers(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "All users fetched successfully.",
    data: result,
  });
});

const myProfileInfo = catchAsync(async (req: Request & { user?: any }, res) => {
  const result = await UserDataServices.myProfileInfo(req.user.id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "My Profile Info Fetched Successfuly.",
    data: result,
  });
});
const changeRole = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await UserDataServices.changeRole(id, req.body);

  //   console.log(req.user);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Role Changed Successfuly.",
    data: result,
  });
});

const changeUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await UserDataServices.changeUserStatus(id, req.body);

  //   console.log(req.user);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: " Status Changed Successfuly.",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await UserDataServices.deleteUser(id);

  //   console.log(req.user);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: " User Deleted Successfuly.",
    data: result,
  });
});
const updateProfile = catchAsync(async (req: Request & { user?: any }, res) => {
  const { id } = req.params;

  const result = await UserDataServices.updateProfile(req.user.id, req.body);

  //   console.log(req.user);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Profile Updated Successfuly.",
    data: result,
  });
});
const changePassword = catchAsync(async (req: Request & { user?: any }, res) => {
  const result = await UserDataServices.changePassword(req.user.id, req.body);

  //   console.log(req.user);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Password Changed Successfuly.",
    data: result,
  });
});


export const UserDataController = {
  getAllUsers,
  changeRole,
  changeUserStatus,
  deleteUser,
  myProfileInfo,
  updateProfile,
  changePassword
};
