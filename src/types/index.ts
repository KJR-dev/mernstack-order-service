import { Request } from "express";
import mongoose from "mongoose";

export type AuthCookie = {
  accessToken: string;
};

export interface AuthRequest extends Request {
  auth: {
    sub: string;
    role: string;
    id?: string;
    tenant: string;
  };
}

export interface PriceConfiguration {
  priceType: "base" | "additional";
  availableOptions: {
    [key: string]: number;
  };
}

export interface ProductPricingCache {
  productId: string;
  priceConfiguration: PriceConfiguration;
}

export enum ProductEvents {
  PRODUCT_CREATE = "PRODUCT_CREATE",
  PRODUCT_UPDATE = "PRODUCT_UPDATE",
  PRODUCT_DELETE = "PRODUCT_DELETE",
}

export interface ProductMessage {
  event_type: ProductEvents;
  data: {
    id: string;
    priceConfiguration: PriceConfiguration;
  };
}

export interface ToppingPricingCache {
  _id: mongoose.Types.ObjectId;
  toppingId: string;
  price: number;
  tenantId: string;
}

export enum ToppingEvents {
  TOPPING_CREATE = "TOPPING_CREATE",
  TOPPING_UPDATE = "TOPPING_UPDATE",
  TOPPING_DELETE = "TOPPING_DELETE",
}

export interface ToppingMessage {
  event_type: ToppingEvents;
  data: {
    id: string;
    price: number;
    tenantId: string;
  };
}

export interface ProductPriceConfiguration {
  [key: string]: {
    priceType: "base" | "additional";
    availableOptions: {
      [key: string]: number;
    };
  };
}

export type Product = {
  _id: string;
  name: string;
  description: string;
  image: string;
  priceConfiguration: ProductPriceConfiguration;
};

export type Topping = {
  id: string;
  name: string;
  image: string;
  price: number;
  // isAvailable: boolean;
};

export interface CartItem extends Pick<
  Product,
  "_id" | "name" | "image" | "priceConfiguration"
> {
  reduce(
    arg0: (acc: unknown, item: unknown) => unknown[],
    arg1: undefined[],
  ): unknown;
  map(arg0: (item: unknown) => unknown): unknown;
  chosenConfiguration: {
    priceConfiguration: {
      [key: string]: string;
    };
    selectedToppings: Topping[];
  };
  qty: number;
}
