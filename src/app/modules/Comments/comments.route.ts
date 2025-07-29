import express from "express";
import { USER_ROLE } from "@prisma/client";

import RoleValidation from "../../middlewares/RoleValidation";
import { commentController } from "./comments.controller";
const router = express.Router();

router.post(
  "/add-comment",
  RoleValidation(USER_ROLE.admin),
  commentController.addComment
);

export const CommentRoutes = router;
