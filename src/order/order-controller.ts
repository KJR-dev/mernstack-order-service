import { Request, Response } from "express";
import { Logger } from "winston";
import couponModel from "../coupon/coupon-model";
import productCacheModel from "../productCache/productCacheModel";
import toppingCacheModel from "../toppingCache/toppingCacheModel";
import {
  CartItem,
  ProductPricingCache,
  Topping,
  ToppingPricingCache,
} from "../types";

export class OrderController {
  constructor(private logger: Logger) {}

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
    const totalPrice = await this.calculateTotal(req.body.cart);
    let discountPercentage = 0;
    const couponCode = req.body.couponCode;
    const tenantId = req.body.tenantId;
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

    return res.json({
      finalTotal,
    });
  };
}
// 5 items - 900
// total 900 -> db

// order - service            product - service
//   5 items - 900             5 items- 900 1000 throw error
