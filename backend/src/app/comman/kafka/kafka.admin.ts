import type { ITopicConfig } from "kafkajs";
import { kafkaClient, LOCATION_TOPIC } from "./kafka.client.js";

// Naya topic chahiye to bas yahan ek object jod do
const TOPICS: ITopicConfig[] = [
  { topic: LOCATION_TOPIC, numPartitions: 2, replicationFactor: 3 },
  { topic: "request-events", numPartitions: 2, replicationFactor: 3 },
];

export async function createKafkaTopics() {
  const admin = kafkaClient.admin();
  await admin.connect();

  try {
    const existing = new Set(await admin.listTopics());

    const missing = TOPICS.filter((t) => !existing.has(t.topic));
    TOPICS.filter((t) => existing.has(t.topic)).forEach((t) =>
      console.log(`Kafka topic skipped (already exists): ${t.topic}`),
    );

    if (missing.length === 0) return;

    await admin.createTopics({ topics: missing });
    missing.forEach((t) => console.log(`Kafka topic created: ${t.topic}`));
  } catch (error) {
    console.error("Error creating Kafka topics:", error);
    throw error;
  } finally {
    await admin.disconnect();
  }
}
