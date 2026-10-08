import { sql } from "drizzle-orm";
import { db } from "../../../db/index.js"; // apne path ke hisaab se
import { userLocations } from "../../../db/schema.js";
import { kafkaClient, LOCATION_TOPIC } from "./kafka.client.js";

type LocationMsg = { userId: string; lat: number; lng: number; ts: number };

const consumer = kafkaClient.consumer({ groupId: "location-writer" });

export const startLocationConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: LOCATION_TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      try {
        const data: LocationMsg = JSON.parse(message.value.toString());

        console.log(
          `Received location message for user ${data.userId}: lat=${data.lat}, lng=${data.lng}, ts=${data.ts}`,
        );

        // await db
        //   .insert(userLocations)
        //   .values({
        //     userId: data.userId,
        //     lat: data.lat,
        //     lng: data.lng,
        //     updatedAt: new Date(data.ts),
        //   })
        //   .onConflictDoUpdate({
        //     target: userLocations.userId,
        //     set: {
        //       lat: data.lat,
        //       lng: data.lng,
        //       updatedAt: new Date(data.ts),
        //     },
        //     // purana (late aaya) message naye data ko overwrite na kare
        //     setWhere: sql`${userLocations.updatedAt} < ${new Date(data.ts)}`,
        //   });

        await db
          .insert(userLocations)
          .values({
            userId: data.userId,
            lat: data.lat,
            lng: data.lng,
            recordedAt: new Date(data.ts),
          })
          .onConflictDoNothing({
            target: [userLocations.userId, userLocations.recordedAt],
          });
      } catch (err) {
        console.error("Error processing message:", err);
      }
    },
  });
};

export const stopLocationConsumer = () => consumer.disconnect();
