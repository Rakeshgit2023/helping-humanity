import "./app/openapi/zod-extend.js";
import http from "http";
import { Server } from "socket.io";
import { createExpressApplication } from "./app/index.js";
import { env } from "./env.js";

function main() {
  try {
    const server = http.createServer(createExpressApplication());

    const io = new Server();
    io.attach(server);

    io.on("connection", (socket) => {
      console.log(`A new user is connected ${socket.id}`);
      socket.on("disconnect", () => {});
    });

    const PORT = env.PORT || 4000;

    server.listen(PORT, () => {
      console.log(`Server is running port: ${PORT}`);
    });
  } catch (error) {
    console.error("Error in main function:", error);
    process.exit(1);
  }
}

main();
