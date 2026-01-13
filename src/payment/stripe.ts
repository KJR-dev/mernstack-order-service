import config from "config";
import Stripe from "stripe";
import {
  CustomMetadata,
  PaymentGateway,
  PaymentOptions,
  VerifiedSession,
} from "./payment-types";

export class StripeGateway implements PaymentGateway {
  private stripe: Stripe;
  constructor() {
    this.stripe = new Stripe(config.get("stripe.secretKey"));
  }
  async createSession(options: PaymentOptions) {
    const session = await this.stripe.checkout.sessions.create(
      {
        // todo: In Future, Capture structure address from customer
        // customer_email:options.email
        metadata: {
          orderId: options.orderId,
          tenantId:options.tenantId,
        },
        billing_address_collection: "required",
        // todo: In future, capture structure address from customer
        // payment_intent_data: {
        //   shipping: {
        //     name: "Jitendra",
        //     address: {
        //       line1: "Mangalaghat",
        //       city: "Puri",
        //       country: "India",
        //       postal_code: "752001",
        //     },
        //   },
        // },
        line_items: [
          {
            price_data: {
              unit_amount: options.amount * 100,
              product_data: {
                name: "Online Pizza order",
                description: "Total amount to be paid",
                images: ["http://placehold.jp/150x150.png"],
              },
              currency: options.currency || "inr",
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${config.get("frontend.clientUI")}/payment?success=true&orderId=${options.orderId}&tenantId=${options.tenantId}`,
        cancel_url: `${config.get("frontend.clientUI")}/payment?success=false&orderId=${options.orderId}&tenantId=${options.tenantId}`,
      },
      { idempotencyKey: options.idempotencyKey },
    );
    return {
      id: session.id,
      paymentUrl: session.url,
      paymentStatus: session.payment_status,
    };
  }

  async getSession(id: string) {
    const session = await this.stripe.checkout.sessions.retrieve(id);
    const verifiedSession: VerifiedSession = {
      id: session.id,
      paymentStatus: session.payment_status,
      metadata: session.metadata as unknown as CustomMetadata,
    };
    return verifiedSession;
  }
}
