// import { RequestHandler } from "express";
// import catchAsync from "../../../shared/catchAsync";
// import sendResponse from "../../../shared/sendResponse";
// import status from "http-status";
// import { UserService } from "./auth.service";

// const createUser: RequestHandler = catchAsync(async (req, res) => {
//   // console.log(req.body);
//   const result = await UserService.createUser(req.body);

//   sendResponse(res, {
//     statusCode: status.OK,
//     success: true,
//     message: "User Registration Successfuly.",
//     data: result,
//   });
// });
// const loginUser: RequestHandler = catchAsync(async (req, res) => {
//   const result = await UserService.loginUser(req.body);
//   // console.log(result);

//   const { refreshToken, ...others } = result;
//   // console.log(refreshToken);

//   res.cookie("refreshToken", refreshToken, {
//     secure: false,
//     httpOnly: true,
//   });
//   sendResponse(res, {
//     statusCode: status.OK,
//     success: true,
//     message: "User Login Successfuly.",
//     data: result,
//   });
// });

// export const UserController = {
//   createUser,
//   loginUser,
// };



import { RequestHandler } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import status from "http-status";
import { UserService } from "./auth.service";

const createUser: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserService.createUser(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User Registration Successfuly.",
    data: result,
  });
});

const loginUser: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserService.loginUser(req.body);
  const { refreshToken, ...others } = result;

  res.cookie("refreshToken", refreshToken, {
    secure: process.env.NODE_ENV === "production", // HTTPS হলে true
    httpOnly: true,
  });

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User Login Successfuly.",
    data: result,
  });
});

const refreshToken: RequestHandler = catchAsync(async (req, res) => {
  const refreshToken = req.cookies.refreshToken; // cookie থেকে নিচ্ছি
  console.log({refreshToken});

  const result = await UserService.refreshAccessToken(refreshToken);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Access token refreshed successfully.",
    data: result,
  });
});

export const UserController = {
  createUser,
  loginUser,
  refreshToken, // ✅ এটা export করতে ভুলবে না
};
