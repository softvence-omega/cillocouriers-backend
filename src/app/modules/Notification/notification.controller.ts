import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { NotificationService } from "./notification.service";
import sendResponse from "../../../shared/sendResponse";
import status from "http-status";

;

const getAllNotifications = catchAsync(async (_req: Request, res: Response) => {
  const result = await NotificationService.getAll();
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Notifications fetched successfully',
    data: result,
  });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NotificationService.markAsRead(id);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Notification marked as read',
    data: result,
  });
});

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await NotificationService.delete(id);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Notification deleted successfully',
    data: null,
  });
});

export const NotificationController = {
  getAllNotifications,
  markAsRead,
  deleteNotification,
};
