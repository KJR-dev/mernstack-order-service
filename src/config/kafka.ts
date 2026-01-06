import { Consumer, EachMessagePayload, Kafka } from "kafkajs";
import { handleProductUpdate } from "../productCache/productUpdateHandle";
import { handleToppingUpdate } from "../toppingCache/toppingUpdateHandle";
import { MessageBroker } from "../types/broker";

export class KafkaBroker implements MessageBroker {
  private consumer: Consumer;
  constructor(clientId: string, brokers: string[]) {
    const kafka = new Kafka({ clientId, brokers });
    this.consumer = kafka.consumer({ groupId: clientId });
  }

  /**
   * connect the consumer
   */
  async connectConsumer() {
    await this.consumer.connect();
  }

  /**
   * disconnect the consumer
   */
  async disconnectConsumer() {
    await this.consumer.disconnect();
  }

  async consumeMessage(topics: string[], fromBeginning: boolean = false) {
    await this.consumer.subscribe({ topics, fromBeginning });

    await this.consumer.run({
      eachMessage: async ({
        topic,
        partition,
        message,
      }: EachMessagePayload) => {
        // Logic to handle incoming message.

        switch (topic) {
          case "product": {
            await handleProductUpdate(message.value.toString());
            return;
          }
          case "topping": {
            await handleToppingUpdate(message.value.toString());
            return;
          }
          default:
            console.log("Doing nothing...");
        }
        console.log({
          value: message.value.toString(),
          topic,
          partition,
        });
      },
    });
  }
}
