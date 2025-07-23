import express from "express";
import { NotificationController } from "./notification.controller";
import { USER_ROLE } from "@prisma/client";
import RoleValidation from "../../middlewares/RoleValidation";

const router = express.Router();

router.get(
  "/",
  RoleValidation(USER_ROLE.admin),
  NotificationController.getAllNotifications
);
router.patch(
  "/read/:id",
  RoleValidation(USER_ROLE.admin),
  NotificationController.markAsRead
);
router.delete(
  "/delete/:id",
  RoleValidation(USER_ROLE.admin),
  NotificationController.deleteNotification
);

export const NotificationRoutes = router;
