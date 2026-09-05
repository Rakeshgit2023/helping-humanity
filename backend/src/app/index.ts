import express from "express";
import type { Application } from "express";
import interestRouter from "./module/interest/route.js";
import authRouter from "./module/auth/route.js";
import { errorHandler } from "./comman/middleware/error.middleware.js";

export const createExpressApplication = (): Application => {
  const app = express();
  app.use(express.json());

  app.get("/health", (_, res) => {
    res.status(200).json({ status: "ok", healthy: true });
  });

  app.use("/interest", interestRouter);
  app.use("/auth", authRouter);

  app.use(errorHandler);

  return app;
};
