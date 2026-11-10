import { Kafka, logLevel } from "kafkajs";
import type { SASLOptions } from "kafkajs";
import { env } from "../../../env.js";

export const LOCATION_TOPIC = env.KAFKA_LOCATION_TOPIC;

export const kafkaClient = new Kafka({
  clientId: "helping-humanity",
  brokers: env.KAFKA_BROKERS.split(","),
  ssl: true,
  sasl: {
    mechanism: env.KAFKA_SASL_MECHANISM,
    username: env.KAFKA_USERNAME,
    password: env.KAFKA_PASSWORD,
  } as SASLOptions,
  logLevel: logLevel.WARN,
  connectionTimeout: 10000,
  requestTimeout: 30000,
});
