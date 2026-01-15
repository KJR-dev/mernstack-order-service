import { NextFunction, Request, Response } from "express";
import { Request as AuthRequest } from "express-jwt";
import createHttpError from "http-errors";
import { Logger } from "winston";
import couponModel from "../coupon/coupon-model";
import { CustomerService } from "../customer/customer-service";
import { IdempotencyService } from "../idempotency/idempotency-service";
import { PaymentGateway } from "../payment/payment-types";
import productCacheModel from "../productCache/productCacheModel";
import toppingCacheModel from "../toppingCache/toppingCacheModel";
import {
  CartItem,
  ProductPricingCache,
  Topping,
  ToppingPricingCache,
} from "../types";
import { MessageBroker } from "../types/broker";
import { OrderService } from "./order-service";
import { OrderStatus, PaymentMode, PaymentStatus } from "./order-types";

export class OrderController {
  constructor(
    private logger: Logger,
    private orderService: OrderService,
    private idempotencyService: IdempotencyService,
    private paymentGateway: PaymentGateway,
    private broker: MessageBroker,
    private customerService: CustomerService,
  ) {}

  // =============================
  // Calculate Cart Total
  // =============================
  private calculateTotal = async (cart: CartItem[]) => {
    // Collect product ids
    const productIds = cart.map((item) => item._id);

    // Collect topping ids safely
    const cartToppingIds = cart.reduce<string[]>((acc, item) => {
      acc.push(
        ...item.chosenConfiguration.selectedToppings.map(
          (topping) => topping.id,
        ),
      );
      return acc;
    }, []);

    // Fetch product pricing cache (cache is optional)
    const productPricings: ProductPricingCache[] = await productCacheModel.find(
      {
        productId: { $in: productIds },
      },
    );

    // Fetch topping cache
    const toppingPricings: ToppingPricingCache[] = await toppingCacheModel.find(
      {
        toppingId: { $in: cartToppingIds },
      },
    );

    // Calculate total price
    const totalPrice = cart.reduce<number>((acc, curr) => {
      const cachedProductPrice = productPricings.find(
        (product) => product.productId === curr._id,
      );

      return (
        acc +
        curr.qty * this.getItemTotal(curr, cachedProductPrice, toppingPricings)
      );
    }, 0);

    return totalPrice;
  };

  // =============================
  // Calculate Single Item Total
  // =============================
  private getItemTotal = (
    item: CartItem,
    cachedProductPrice: ProductPricingCache | undefined,
    toppingPricings: ToppingPricingCache[],
  ) => {
    // Use cache if available, otherwise payload pricing
    const priceSource =
      cachedProductPrice?.priceConfiguration ?? item.priceConfiguration;

    if (!cachedProductPrice) {
      this.logger.warn(
        `Cache miss for product ${item._id}, using payload pricing`,
      );
    }

    const productTotal = Object.entries(
      item.chosenConfiguration.priceConfiguration,
    ).reduce((acc, [key, value]) => {
      const price = priceSource[key].availableOptions[value];
      return acc + price;
    }, 0);

    const toppingsTotal = item.chosenConfiguration.selectedToppings.reduce(
      (acc, curr) => {
        return acc + this.getCurrentToppingPrice(curr, toppingPricings);
      },
      0,
    );

    return productTotal + toppingsTotal;
  };

  // =============================
  // Get Topping Price
  // =============================
  private getCurrentToppingPrice = (
    topping: Topping,
    toppingPricings: ToppingPricingCache[],
  ) => {
    const currentTopping = toppingPricings.find(
      (current) => current.toppingId === topping.id,
    );

    // Cache fallback to cart price
    return currentTopping?.price ?? topping.price;
  };

  // =============================
  // Get coupon code
  // =============================
  private getDiscountPercentage = async (
    couponCode: string,
    tenantId: string,
  ) => {
    const code = await couponModel.findOne({ code: couponCode, tenantId });
    if (!code) {
      return 0;
    }
    const currentDate = new Date();
    const couponDate = new Date(code.validUpto);
    if (currentDate <= couponDate) {
      return code.discount;
    }
    return 0;
  };
  // =============================
  // Create Order
  // =============================
  create = async (req: Request, res: Response) => {
    const {
      cart,
      couponCode,
      tenantId,
      paymentMode,
      customerId,
      comment,
      address,
    } = req.body;

    const idempotencyKey = req.headers["idempotency-key"] as string;
    if (!idempotencyKey) {
      return res.status(400).json({ message: "Idempotency key required" });
    }

    // 🔁 Idempotency check
    const existing = await this.idempotencyService.get(idempotencyKey);
    if (existing) {
      return res.json({ newOrder: existing.response });
    }

    const totalPrice = await this.calculateTotal(cart);
    let discountPercentage = 0;

    if (couponCode) {
      discountPercentage = await this.getDiscountPercentage(
        couponCode,
        tenantId,
      );
    }
    const discountAmount = Math.round((totalPrice * discountPercentage) / 100);

    const priceAfterDiscount = totalPrice - discountAmount;
    // todo: May be store in db for each tenant
    const TAXES_PERCENT = 18;
    const taxes = Math.round((priceAfterDiscount * TAXES_PERCENT) / 100);
    const DELIVERY_CHARGES = 100;
    const finalTotal = priceAfterDiscount + taxes + DELIVERY_CHARGES;

    // Create an order
    const orderData = {
      cart,
      address,
      comment,
      customerId,
      DELIVERY_CHARGES,
      discountAmount,
      taxes,
      tenantId,
      finalTotal,
      paymentMode,
      orderStatus: OrderStatus.RECEIVED,
      paymentStatus: PaymentStatus.PENDING,
      idempotency: idempotencyKey,
    };
    const newOrder = await this.orderService.create(orderData);

    // Payment processing
    // todo: Error handling
    // todo: add logging
    if (paymentMode === PaymentMode.CARD) {
      const session = await this.paymentGateway.createSession({
        amount: finalTotal,
        orderId: newOrder._id.toString(),
        tenantId: tenantId,
        currency: "inr",
        idempotencyKey: idempotencyKey,
      });
      await this.broker.sendMessage("order", JSON.stringify(newOrder));
      // todo: Update order document -> paymentid -> sessionId
      return res.json({
        paymentUrl: session.paymentUrl,
      });
    }
    await this.broker.sendMessage("order", JSON.stringify(newOrder));
    return res.json({
      paymentUrl: null,
    });
  };

  getByUserId = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.auth.sub;
    if (!userId) {
      return next(createHttpError(400, "No user id found!"));
    }

    // todo: Add error handling.
    const customer = await this.customerService.get(userId);

    if (!customer) {
      return next(createHttpError(400, "No customer found!"));
    }

    // todo: Implement pagination.
    const order = await this.orderService.getByUserId(customer._id);

    res.json(order);
  };

  getByOrderId = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    const { orderId } = req.params;
    const { sub: userId, role, tenant: tenantId } = req.auth;
    const fields =
      typeof req.query.fields === "string" ? req.query.fields.split(",") : [];
    const order = await this.orderService.getByOrderId(orderId, fields);
    if (!order) {
      return next(createHttpError(400, "Order does not exist"));
    }
    // What roles can access this endpoint: [Admin, Manager(only access own restaurant user order), User(Own order)]
    if (role === "admin") {
      return res.json(order);
    }

    const myRestaurantOrder = order.tenantId === tenantId;
    if (role === "manager" && myRestaurantOrder) {
      return res.json(order);
    }

    if (role === "customer") {
      const customer = await this.customerService.get(userId.toString());
      if (!customer) {
        return next(createHttpError(400, "Customer not found"));
      }
      if (order.customerId.toString() === customer._id.toString()) {
        return res.json(order);
      }
    }

    return next(createHttpError(403, "Operation not permitted."));
  };
}
