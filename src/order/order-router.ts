import express from "express";
import authenticate from "../common/middleware/authenticate";
import { asyncWrapper } from "../utils";
import logger from "../config/logger";
import { OrderController } from "./order-controller";

const orderRouter = express.Router();
const orderController = new OrderController(logger);

orderRouter.post("/", authenticate, asyncWrapper(orderController.create));

export default orderRouter;
