import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { getInTouchService } from "./getInTouch.service";
import status from "http-status";

const insertGetInTouchMessage = catchAsync(
  async (req: Request, res: Response) => {

    console.log('get in touch');
    const result = await getInTouchService.insertGetInTouchMessage(req.body);
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Message sent successfully",
      data: result,
    });
  }
);
const GetAllMessages = catchAsync(
  async (req: Request, res: Response) => {
    const result = await getInTouchService.GetAllMessages(req.query);
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Messages fetched successfully",
      data: result,
    });
  }
);

export const GetInTouchController = {
  insertGetInTouchMessage,
  GetAllMessages
};
