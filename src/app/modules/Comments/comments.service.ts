import { Comment } from "@prisma/client";
import prisma from "../../../shared/prisma";
import AppError from "../../Errors/AppError";
import status from "http-status";

const addComment = async (data: Comment) => {
  const { ticketId } = data;
  // Check if ticket exists
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });
  if (!ticket) {
    throw new AppError(status.NOT_FOUND, "Ticket not found.");
  }
  // Create new comment
  const comment = await prisma.comment.create({
    data,
  });
  return comment;
};

export const commentService = {
  addComment,
};
