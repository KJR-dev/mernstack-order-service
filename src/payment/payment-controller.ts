import { Request, Response } from "express";
import orderModel from "../order/order-model";
import { PaymentStatus } from "../order/order-types";
import { PaymentGateway } from "./payment-types";

export class PaymentController {
  constructor(private paymentGateway: PaymentGateway) {}
  handleWebhook = async (req: Request, res: Response) => {
    const webhookBody = req.body;
    if (webhookBody.type === "checkout.session.completed") {
      const verifiedSession = await this.paymentGateway.getSession(
        webhookBody.data.object.id,
      );
      const isPaymentSuccess = verifiedSession.paymentStatus === "paid";
      await orderModel.findOneAndUpdate(
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
    }

    res.json({ success: true });
  };
}
