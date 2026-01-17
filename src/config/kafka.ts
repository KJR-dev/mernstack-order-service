import { Consumer, EachMessagePayload, Kafka, Producer } from "kafkajs";
import { handleProductUpdate } from "../productCache/productUpdateHandle";
import { handleToppingUpdate } from "../toppingCache/toppingUpdateHandle";
import { MessageBroker } from "../types/broker";

export class KafkaBroker implements MessageBroker {
  private consumer: Consumer;
  private producer: Producer;

  constructor(clientId: string, brokers: string[]) {
    const kafka = new Kafka({ clientId, brokers });

    this.producer = kafka.producer();

    // ⚠️ groupId should be service-specific, NOT clientId
    this.consumer = kafka.consumer({
      groupId: `${clientId}-consumer`,
    });
  }

  async connectConsumer() {
    await this.consumer.connect();
  }

  async connectProducer() {
    await this.producer.connect();
  }

  async disconnectConsumer() {
    await this.consumer.disconnect();
  }

  async disconnectProducer() {
    await this.producer.disconnect();
  }

  async consumeMessage(topics: string[], fromBeginning = false) {
    await this.consumer.subscribe({ topics, fromBeginning });

    await this.consumer.run({
      eachMessage: async ({
        topic,
        partition,
        message,
      }: EachMessagePayload) => {
        try {
          // ✅ 1. Guard against null/empty message
          if (!message.value) {
            console.warn("⚠️ Empty Kafka message", {
              topic,
              partition,
              offset: message.offset,
            });
            return;
          }

          const payloadStr = message.value.toString();

          if (!payloadStr.trim()) {
            console.warn("⚠️ Blank Kafka message value", {
              topic,
              partition,
              offset: message.offset,
            });
            return;
          }

          // ✅ 2. Route messages safely
          switch (topic) {
            case "product":
              await handleProductUpdate(payloadStr);
              break;

            case "topping":
              await handleToppingUpdate(payloadStr);
              break;

            default:
              console.log(`ℹ️ No handler for topic: ${topic}`);
          }
        } catch (error) {
          // ✅ 3. DO NOT throw → prevents infinite retries
          console.error("❌ Kafka message processing failed", {
            topic,
            partition,
            offset: message.offset,
            error: (error as Error).message,
            rawValue: message.value?.toString(),
          });
        }
      },
    });
  }

  async sendMessage(topic: string, message: string, key: string) {
    // ✅ Producer safety
    if (!message || !message.trim()) {
      throw new Error("Kafka message cannot be empty");
    }

    const data: { value: string; key?: string } = {
      value: message,
    };

    if (key) {
      data.key = key;
    }

    await this.producer.send({
      topic,
      messages: [data],
    });
  }
}
