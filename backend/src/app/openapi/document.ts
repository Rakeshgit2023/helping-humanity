import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import type { OpenAPIObject } from "openapi3-ts/oas31";
import { registry } from "./registry.js";

// Import every module's paths file here purely for its side effect —
// each one calls registry.registerPath(...) when imported. If you add a
// new module's paths file and forget to import it here, its endpoints
// just won't show up in the generated docs (no error, so it's worth
// double-checking after adding a new one).
import "./paths/auth.paths.js";
import "./paths/category.paths.js";

export function generateOpenApiDocument(): OpenAPIObject {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Help In Humanity API",
      version: "1.0.0",
      description:
        "Auto-generated from the app's Zod DTOs — always in sync with actual validation.",
    },
    servers: [{ url: "/", description: "Current environment" }],
  });
}
