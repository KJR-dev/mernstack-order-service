import config from "config";
import app from "./src/app";
import { createMessageBroker } from "./src/common/factories/brokerFactory";
import connectDB from "./src/config/db";
import logger from "./src/config/logger";
import { MessageBroker } from "./src/types/broker";

const startServer = async () => {
  const PORT = config.get("server.port") || 5503;
  let broker: MessageBroker | null = null;
  try {
    await connectDB();
    broker = createMessageBroker();
    await broker.connectConsumer();
    await broker.consumeMessage(['product','topping'], false);
    app
      .listen(PORT, () => console.log(`Listening on port ${PORT}`))
      .on("error", async (err) => {
        console.log("err", err.message);
        if (broker) {
          await broker.disconnectConsumer();
        }
        process.exit(1);
      });
  } catch (err) {
    logger.error("Error happened: ", err.message);
    process.exit(1);
  }
};

void startServer();
