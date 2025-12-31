import express from "express";
import authenticate from "../common/middleware/authenticate";
import { asyncWrapper } from "../utils";
import { CustomerController } from "./customer-controller";
import { CustomerService } from "./customer-service";
import logger from "../config/logger";

const customerRouter = express.Router();
const customerService = new CustomerService();
const customerController = new CustomerController(customerService, logger);

customerRouter.get("/", authenticate, asyncWrapper(customerController.get));

export default customerRouter;
