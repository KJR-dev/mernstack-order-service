import { Request, Response } from "express";
import { Logger } from "winston";
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

    // Fetch product pricing cache (cache is optional)
    const productPricings: ProductPricingCache[] = await productCacheModel.find(
      {
        productId: { $in: productIds },
      },
    );

    // Collect topping ids safely
    const cartToppingIds = cart.reduce<string[]>((acc, item) => {
      acc.push(
        ...item.chosenConfiguration.selectedToppings.map(
          (topping) => topping.id,
        ),
      );
      return acc;
    }, []);

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
  // Create Order
  // =============================
  create = async (req: Request, res: Response) => {
    const rawCart = req.body.cart;

    // Normalize cart (single item or array)
    if (!rawCart) {
      return res.status(400).json({
        success: false,
        message: "Cart is required",
      });
    }

    const cart: CartItem[] = Array.isArray(rawCart) ? rawCart : [rawCart];

    const totalPrice = await this.calculateTotal(cart);

    return res.json({
      success: true,
      totalPrice,
    });
  };
}
