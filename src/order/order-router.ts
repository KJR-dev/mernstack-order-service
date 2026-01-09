import express from "express";
import authenticate from "../common/middleware/authenticate";
import logger from "../config/logger";
import { IdempotencyService } from "../idempotency/idempotency-service";
import { asyncWrapper } from "../utils";
import { OrderController } from "./order-controller";
import { OrderService } from "./order-service";

const orderRouter = express.Router();
const orderService = new OrderService();
const idempotencyService = new IdempotencyService();
const orderController = new OrderController(
  logger,
  orderService,
  idempotencyService,
);

orderRouter.post("/", authenticate, asyncWrapper(orderController.create));

export default orderRouter;
