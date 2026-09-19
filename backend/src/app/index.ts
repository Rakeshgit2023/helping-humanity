import swaggerUi from "swagger-ui-express";
import { generateOpenApiDocument } from "./openapi/document.js";
import express from "express";
import type { Application } from "express";
import authRouter from "./module/auth/route.js";
import categoryRouter from "./module/category/route.js";
import { errorHandler } from "./comman/middleware/error.middleware.js";

export const createExpressApplication = (): Application => {
  const app = express();
  app.use(express.json());

  app.get("/health", (_, res) => {
    res.status(200).json({ status: "ok", healthy: true });
  });

  app.get("/openapi.json", (req, res) => res.json(generateOpenApiDocument()));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(generateOpenApiDocument()));

  app.use("/auth", authRouter);
  app.use("/category", categoryRouter);

  app.use(errorHandler);

  return app;
};
