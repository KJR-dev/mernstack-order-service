import { Request, Response } from "express";
import orderModel from "../order/order-model";
import { PaymentStatus } from "../order/order-types";
import { MessageBroker } from "../types/broker";
import { PaymentGateway } from "./payment-types";

export class PaymentController {
  constructor(
    private paymentGateway: PaymentGateway,
    private broker: MessageBroker,
  ) {}
  handleWebhook = async (req: Request, res: Response) => {
    const webhookBody = req.body;
    if (webhookBody.type === "checkout.session.completed") {
      const verifiedSession = await this.paymentGateway.getSession(
        webhookBody.data.object.id,
      );
      const isPaymentSuccess = verifiedSession.paymentStatus === "paid";
      const updateProduct = await orderModel.findOneAndUpdate(
        {
          _id: verifiedSession.metadata.orderId,
        },
        {
          paymentStatus: isPaymentSuccess
            ? PaymentStatus.PAID
            : PaymentStatus.FAILED,
        },
        { new: true },
      );
      // todo: Think about message broker fail.
      await this.broker.sendMessage("order", JSON.stringify(updateProduct));
    }

    res.json({ success: true });
  };
}
