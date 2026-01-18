import { ProductMessage } from "../types";
import productCacheModel from "./productCacheModel";

export const handleProductUpdate = async (value: string) => {
  try {
    const product: ProductMessage = JSON.parse(value);

    if (!product?.data.id) {
      throw new Error("Invalid product message: missing product id");
    }

    return await productCacheModel.updateOne(
      { productId: product.data.id },
      {
        $set: {
          priceConfiguration: product.data.priceConfiguration,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    throw new Error(
      `handleProductUpdate failed | payload=${value} | error=${error.message}`,
    );
  }
};
