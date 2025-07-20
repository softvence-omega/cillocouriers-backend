import status from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { UserDataServices } from "./user.service";
import { Request } from "express";

const getAllUsers = catchAsync(async (req, res) => {
  // console.log(req.query);
  const { searchTerm, ...options } = req.query;
  // console.log(options);
  const result = await UserDataServices.getAllUsers(req.query, options);

  //   console.log(req.user);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "All User Fetched Successfuly.",
    data: result,
  });
});
const myProfileInfo = catchAsync(async (req: Request & { user?: any }, res) => {

  const result = await UserDataServices.myProfileInfo(req.user.id);

  //   console.log(req.user);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "My Profile Info Fetched Successfuly.",
    data: result,
  });
});
const makeUserToAdmin = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await UserDataServices.makeUserToAdmin(id);

  //   console.log(req.user);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Make Admin Successfuly.",
    data: result,
  });
});
const makeAdminToUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await UserDataServices.makeAdminToUser(id);

  //   console.log(req.user);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Make User Successfuly.",
    data: result,
  });
});
const blockUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await UserDataServices.blockUser(id);

  //   console.log(req.user);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: " User Blocked Successfuly.",
    data: result,
  });
});
const makeActive = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await UserDataServices.makeActive(id);

  //   console.log(req.user);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: " User Actived Successfuly.",
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

export const UserDataController = {
  getAllUsers,
  makeUserToAdmin,
  makeAdminToUser,
  blockUser,
  makeActive,
  deleteUser,
  myProfileInfo
};
