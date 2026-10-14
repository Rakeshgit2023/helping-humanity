import z from "zod";
import { commonErrorResponses } from "../../comman/dto/response.dto.js";
import { allowedMimeTypes } from "../../comman/middleware/upload.middleware.js";
import {
  createRequestResponseSchema,
  createRequestSchema,
} from "../../module/request/dto/createRequest.dto.js";
import { registry } from "../registry.js";

// These mirror what the route actually enforces:
//   upload("image", 2)                  -> max 2 files, image types only
//   validate(dto, "body", true)         -> at least 1 file (requireFiles)
//   multer limits.fileSize (5 MB)       -> in upload.middleware.ts
// If you change any of those, change them here too — the docs can't read
// them from the middleware, so this is the one place that can drift.
const MIN_FILES = 1;
const MAX_FILES = 2;
const MAX_FILE_SIZE_MB = 5;

// The request DTO plus the `files` part of the multipart body. `files` isn't
// in the DTO (multer handles it before validation), so it's added here for
// documentation only.
const createRequestMultipartSchema = createRequestSchema.extend({
  files: z
    .array(
      z.string().openapi({
        type: "string",
        format: "binary",
        description: `Allowed file types: ${allowedMimeTypes.image.join(", ")}. Max ${MAX_FILE_SIZE_MB} MB each.`,
      }),
    )
    .min(MIN_FILES)
    .max(MAX_FILES),
});

registry.registerPath({
  method: "post",
  path: "/request",
  tags: ["Request"],
  summary: "Create a request",
  description:
    `Creates a new assistance request with ${MIN_FILES} to ${MAX_FILES} image attachments ` +
    "(sent as multipart/form-data, field name `files`). " +
    'The `category` field must be sent as a JSON string: {"id": "<category uuid>", "name": "<category name>"}. ' +
    "Blood group and hospital name are required only for blood donation requests, " +
    "and are rejected for every other category.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: createRequestMultipartSchema,
          encoding: {
            // Without this, Swagger UI would send `category` as plain text
            // and the DTO's JSON.parse preprocess would get "[object Object]".
            category: { contentType: "application/json" },
            files: { contentType: allowedMimeTypes.image.join(", ") },
          },
          // Category ids below are placeholders — swap in real ids from
          // GET /category so "Try it out" works against your database.
          examples: {
            foodDonation: {
              summary: "Create a food donation request",
              value: {
                category: {
                  id: "550e8400-e29b-41d4-a716-446655440000",
                  name: "food donation",
                },
                title: "Need food assistance",
                description: "Food required for a family",
                lat: 22.5726,
                lng: 88.3639,
                address: "Kolkata, West Bengal",
                priority: "normal",
                broadcastRadiusKm: 3,
                totalVolunteersNeeded: 1,
              },
            },
            bloodDonation: {
              summary: "Create a blood donation request",
              value: {
                category: {
                  id: "550e8400-e29b-41d4-a716-446655440001",
                  name: "blood donation",
                },
                title: "Urgent blood donation required",
                description: "Blood required for a patient",
                lat: 22.5726,
                lng: 88.3639,
                address: "Kolkata, West Bengal",
                bloodGroupNeeded: "O+",
                hospitalName: "ABC Hospital",
                priority: "urgent",
                broadcastRadiusKm: 3,
                totalVolunteersNeeded: 2,
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Request created successfully",
      content: {
        "application/json": {
          schema: createRequestResponseSchema,
        },
      },
    },
    ...commonErrorResponses,
  },
});
