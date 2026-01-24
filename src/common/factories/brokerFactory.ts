import config from "config";
import { KafkaBroker } from "../../config/kafka";
import { MessageBroker } from "../../types/broker";

let broker: MessageBroker | null = null;
export const createMessageBroker = (): MessageBroker => {
  if (!broker) {
    console.log("🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥", config.get("kafka.brokers"));
    broker = new KafkaBroker("order-service", config.get("kafka.brokers"));
  }
  return broker;
};