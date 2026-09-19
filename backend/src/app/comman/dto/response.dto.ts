import { z } from "zod";

export const errorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
});

export const commonErrorResponses = {
  400: {
    description: "Bad Request",
    content: {
      "application/json": {
        schema: errorResponseSchema,
      },
    },
  },

  401: {
    description: "Unauthorized",
    content: {
      "application/json": {
        schema: errorResponseSchema,
      },
    },
  },

  403: {
    description: "Forbidden",
    content: {
      "application/json": {
        schema: errorResponseSchema,
      },
    },
  },

  404: {
    description: "Not Found",
    content: {
      "application/json": {
        schema: errorResponseSchema,
      },
    },
  },

  409: {
    description: "Conflict",
    content: {
      "application/json": {
        schema: errorResponseSchema,
      },
    },
  },

  422: {
    description: "Unprocessable Entity",
    content: {
      "application/json": {
        schema: errorResponseSchema,
      },
    },
  },

  500: {
    description: "Internal Server Error",
    content: {
      "application/json": {
        schema: errorResponseSchema,
      },
    },
  },
};
