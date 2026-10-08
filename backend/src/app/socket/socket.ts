import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { socketAuth } from "../comman/middleware/socket.auth.middleware.js";
import { publishLocation } from "../comman/kafka/location.producer.js";

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: { origin: "*" }, // production me apna frontend origin
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    const user = socket.data.user;
    console.log(`A new user is connected ${socket.id}`);
    console.log(`Connected User ${user}`);

    socket.on("location:update", async (data) => {
      const { lat, lng } = data;
      console.log(
        `Received location update from user ${user.firstName} ${user.lastName}: lat=${lat}, lng=${lng}`,
      );
      // await publishLocation(user.id, lat, lng);
    });

    socket.on("disconnect", () => {});
  });

  return io;
};
