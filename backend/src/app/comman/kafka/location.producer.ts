import { Partitioners } from "kafkajs";
import { kafkaClient, LOCATION_TOPIC } from "./kafka.client.js";

const producer = kafkaClient.producer({
  createPartitioner: Partitioners.DefaultPartitioner,
});

export const connectLocationProducer = () => producer.connect();
export const disconnectLocationProducer = () => producer.disconnect();

export const publishLocation = async (
  userId: string,
  lat: number,
  lng: number,
) => {
  await producer.send({
    topic: LOCATION_TOPIC,
    messages: [
      {
        key: userId, // same user -> same partition -> order sahi rehta hai
        value: JSON.stringify({ userId, lat, lng, ts: Date.now() }),
      },
    ],
  });
};
