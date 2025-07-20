import express from "express";
import { UserRole } from "@prisma/client";

import RoleValidation from "../../middlewares/RoleValidation";
import { UserDataController } from "./user.controller";
const router = express.Router();

router.get(
  "/all-users",
  RoleValidation(UserRole.ADMIN),
  UserDataController.getAllUsers
);
router.get(
  "/my-profile-info",
  RoleValidation(UserRole.ADMIN, UserRole.USER),
  UserDataController.myProfileInfo
);
router.patch(
  "/make-admin/:id",
  RoleValidation(UserRole.ADMIN),
  UserDataController.makeUserToAdmin
);
router.patch(
  "/make-user/:id",
  RoleValidation(UserRole.ADMIN),
  UserDataController.makeAdminToUser
);
router.patch(
  "/block-user/:id",
  RoleValidation(UserRole.ADMIN),
  UserDataController.blockUser
);
router.patch(
  "/make-user-active/:id",
  RoleValidation(UserRole.ADMIN),
  UserDataController.makeActive
);
router.delete(
  "/delete-user/:id",
  RoleValidation(UserRole.ADMIN),
  UserDataController.deleteUser
);

export const UserDataRoutes = router;
