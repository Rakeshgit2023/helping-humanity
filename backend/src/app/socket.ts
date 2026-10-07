import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
// import { socketAuth } from "./socket.auth.js";

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: { origin: "*" }, // production me apna frontend origin do
  });

  //   io.use(socketAuth);

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    console.log(`A new user is connected ${socket.id}`);

    socket.on("disconnect", () => {});
  });

  return io;
};
