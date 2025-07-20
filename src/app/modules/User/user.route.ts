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
  RoleValidation(USER_ROLE.admin, USER_ROLE.account, USER_ROLE.dispatch, USER_ROLE.marchant, USER_ROLE.warehouse),
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
router.delete(
  "/delete-user/:id",
  RoleValidation(USER_ROLE.admin),
  UserDataController.deleteUser
);

export const UserDataRoutes = router;
