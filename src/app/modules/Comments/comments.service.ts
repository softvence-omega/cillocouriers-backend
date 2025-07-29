import { Comment } from "@prisma/client";

const addComment = async (data: Comment) => {
  console.log("Comment Data...", data);
};

export const commentService = {
  addComment,
};
