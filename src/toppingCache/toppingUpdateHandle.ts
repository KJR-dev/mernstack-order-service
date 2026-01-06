import { ToppingMessage } from "../types";
import toppingCacheModel from "./toppingCacheModel";

export const handleToppingUpdate = async (value: string) => {
  try {
    const topping: ToppingMessage = JSON.parse(value);
    console.log("✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅",topping);

    if (!topping?.id) {
      throw new Error("Invalid topping message: missing topping id");
    }

    return await toppingCacheModel.updateOne(
      { toppingId: topping.id },
      {
        $set: {
          price: topping.price,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    throw new Error(
      `handleToppingUpdate failed | payload=${value} | error=${error.message}`,
    );
  }
};
