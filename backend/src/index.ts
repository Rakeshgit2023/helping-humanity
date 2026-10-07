import "./app/openapi/zod-extend.js";
import http from "http";
import { createExpressApplication } from "./app/index.js";
import { env } from "./env.js";
import {
  startLocationConsumer,
  stopLocationConsumer,
} from "./app/comman/kafka/location.consumer.js";
import {
  connectLocationProducer,
  disconnectLocationProducer,
} from "./app/comman/kafka/location.producer.js";
import { initSocket } from "./app/socket.js";
import { createKafkaTopics } from "./app/comman/kafka/kafka.admin.js";

async function main() {
  try {
    await createKafkaTopics();

    const server = http.createServer(createExpressApplication());

    const io = initSocket(server);

    await connectLocationProducer();
    await startLocationConsumer();

    const PORT = env.PORT || 4000;

    server.listen(PORT, () => {
      console.log(`Server is running port: ${PORT}`);
    });

    const shutdown = async () => {
      io.close();
      await stopLocationConsumer();
      await disconnectLocationProducer();
      server.close(() => process.exit(0));
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Error in main function:", error);
    process.exit(1);
  }
}

main();
