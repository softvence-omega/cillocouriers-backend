import express from "express";
import { USER_ROLE } from "@prisma/client";

import RoleValidation from "../../middlewares/RoleValidation";
import { SupportController } from "./support.controller";
import { upload } from "../../middlewares/upload";
const router = express.Router();


router.get('/all-support-requests',
  RoleValidation(USER_ROLE.admin),
  SupportController.allSupportRequests
);

router.get(
  "/my-support-requests",
  RoleValidation(USER_ROLE.marchant),
  SupportController.mySupportRequests
);

// router.post(
//   "/add-support",
//   upload.single("image"),
//   RoleValidation(USER_ROLE.marchant),
//   SupportController.addSupport
// );

router.post(
  "/add-support",
  upload.array("image"), // Allow multiple files (change from single to array)
  RoleValidation(USER_ROLE.marchant),
  SupportController.addSupport
);




export const SupportRoutes = router;
