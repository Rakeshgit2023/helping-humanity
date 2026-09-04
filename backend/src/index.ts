import http from "http";
import { createExpressApplication } from "./app/index.js";
import { env } from "./env.js";

function main() {
  try {
    const server = http.createServer(createExpressApplication());
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
