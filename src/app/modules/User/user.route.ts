import express from "express";
import { USER_ROLE } from "@prisma/client";

import RoleValidation from "../../middlewares/RoleValidation";
import { UserDataController } from "./user.controller";
const router = express.Router();

router.get(
  "/all-users",
  RoleValidation(USER_ROLE.admin),
  UserDataController.getAllUsers
);
router.get(
  "/my-profile-info",
  RoleValidation(USER_ROLE.admin, USER_ROLE.marchant),
  UserDataController.myProfileInfo
);
router.patch(
  "/change-role/:id",
  RoleValidation(USER_ROLE.admin),
  UserDataController.changeRole
);

router.patch(
  "/change-status/:id",
  RoleValidation(USER_ROLE.admin),
  UserDataController.changeUserStatus
);
router.patch(
  "/update-profile",
  RoleValidation(USER_ROLE.admin, USER_ROLE.marchant),
  UserDataController.updateProfile
);

router.patch(
  "/change-password",
  RoleValidation(USER_ROLE.admin, USER_ROLE.marchant),
  UserDataController.changePassword
);
router.delete(
  "/delete-user/:id",
  RoleValidation(USER_ROLE.admin),
  UserDataController.deleteUser
);

export const UserDataRoutes = router;
