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

export interface ProductMessage {
  id: string;
  priceConfiguration: PriceConfiguration;
}

export interface ToppingPricingCache {
  _id:mongoose.Types.ObjectId,
  toppingId: string;
  price: number;
  tenantId: string;
}

export interface ToppingMessage {
  id: string;
  price: number;
  tenantId: string;
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
  reduce(arg0: (acc: any, item: any) => any[], arg1: undefined[]): unknown;
  map(arg0: (item: any) => any): unknown;
  chosenConfiguration: {
    priceConfiguration: {
      [key: string]: string;
    };
    selectedToppings: Topping[];
  };
  qty: number;
}
