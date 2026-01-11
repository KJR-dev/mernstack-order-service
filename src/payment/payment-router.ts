import express from "express";
import { asyncWrapper } from "../utils";
import { PaymentController } from "./payment-controller";
import { StripeGateway } from "./stripe";

const paymentRouter = express.Router();

// todo: move this instantiation to factory
const paymentGateway = new StripeGateway();
const paymentController = new PaymentController(paymentGateway);

paymentRouter.post("/webhook", asyncWrapper(paymentController.handleWebhook));

export default paymentRouter;
