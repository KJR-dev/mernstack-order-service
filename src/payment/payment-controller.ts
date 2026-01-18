import { Request, Response } from "express";
import { CustomerService } from "../customer/customer-service";
import orderModel from "../order/order-model";
import { OrderEvents, PaymentStatus } from "../order/order-types";
import { MessageBroker } from "../types/broker";
import { PaymentGateway } from "./payment-types";

export class PaymentController {
  constructor(
    private paymentGateway: PaymentGateway,
    private broker: MessageBroker,
    private customerService: CustomerService,
  ) {}
  handleWebhook = async (req: Request, res: Response) => {
    const webhookBody = req.body;
    if (webhookBody.type === "checkout.session.completed") {
      const verifiedSession = await this.paymentGateway.getSession(
        webhookBody.data.object.id,
      );
      const isPaymentSuccess = verifiedSession.paymentStatus === "paid";
      const updateOrder = await orderModel.findOneAndUpdate(
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
      const customer = await this.customerService.get(
        updateOrder[0].customerId,
      );
      // todo: Think about message broker fail.
      const brokerMessage = {
        event_types: OrderEvents.PAYMENT_STATUS_UPDATE,
        data: { ...updateOrder.toObject(), customerId: customer },
      };
      await this.broker.sendMessage(
        "order",
        JSON.stringify(brokerMessage),
        updateOrder._id.toString(),
      );
    }

    res.json({ success: true });
  };
}
