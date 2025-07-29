import { Request } from "express";
import catchAsync from "../../../shared/catchAsync";
import { commentService } from "./comments.service";
import sendResponse from "../../../shared/sendResponse";
import status from "http-status";

const addComment = catchAsync(async (req: Request & { user?: any }, res) => {
  const commentData = {
    ...req.body,
    authorId: req.user.id,
  };
  const result = await commentService.addComment(commentData);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Comment Added successfully.",
    data: result,
  });
});

export const commentController = {
  addComment,
};
