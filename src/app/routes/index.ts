import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.route";
import { UserDataRoutes } from "../modules/User/user.route";
import { AddressRoutes } from "../modules/Address/address.route";
import { CustomerRoutes } from "../modules/Customar/customar.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/user",
    route: UserDataRoutes
  },
  {
    path: "/address",
    route: AddressRoutes
  },
  {
    path: "/customer",
    route: CustomerRoutes
  }

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
