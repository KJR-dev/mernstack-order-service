import express from "express";
import { asyncWrapper } from "../utils";
import { PaymentController } from "./payment-controller";
import { StripeGateway } from "./stripe";
import { createMessageBroker } from "../common/factories/brokerFactory";

const paymentRouter = express.Router();

// todo: move this instantiation to factory
const paymentGateway = new StripeGateway();
const broker = createMessageBroker();
const paymentController = new PaymentController(paymentGateway, broker);

paymentRouter.post("/webhook", asyncWrapper(paymentController.handleWebhook));

export default paymentRouter;
