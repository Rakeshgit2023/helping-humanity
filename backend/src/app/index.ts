import express from "express";
import type { Application } from "express";

export const createExpressApplication = (): Application => {
  const app = express();

  app.get("/health", (_, res) => {
    res.status(200).json({ status: "ok", healthy: true });
  });
  return app;
};
