import z from "zod";
import { commonErrorResponses } from "../../comman/dto/response.dto.js";
import { allowedMimeTypes } from "../../comman/middleware/upload.middleware.js";
import {
  createRequestResponseSchema,
  createRequestSchema,
} from "../../module/request/dto/createRequest.dto.js";
import { acceptRequestBodySchema } from "../../module/request/dto/acceptRequest.dto.js";
import { requestIdParamSchema } from "../../module/request/dto/requestIdParam.dto.js";
import { chatHistoryQuerySchema } from "../../module/chat-history/dto/chatHistory.dto.js";
import { registry } from "../registry.js";

const requestIdParamsSchema = requestIdParamSchema.extend({
  requestId: requestIdParamSchema.shape.requestId.openapi({
    param: {
      name: "requestId",
      in: "path",
    },
    description: "UUID of the request",
    example: "550e8400-e29b-41d4-a716-446655440000",
  }),
});

const requestActionResponseSchema = (data: z.ZodType) =>
  z.object({
    message: z.string(),
    data,
  });

const volunteersForRequestResponseSchema = requestActionResponseSchema(
  z.object({
    request: z.object({
      id: z.uuid(),
      requesterId: z.uuid(),
      status: z.string(),
      expiresAt: z.iso.datetime().nullable(),
      lat: z.number(),
      lng: z.number(),
      address: z.string().nullable(),
      broadcastRadiusKm: z.number(),
    }),
    volunteers: z.array(
      z.object({
        volunteerId: z.uuid(),
        firstName: z.string(),
        lastName: z.string(),
        lat: z.number(),
        lng: z.number(),
        recordedAt: z.iso.datetime(),
        distanceKm: z.number(),
      }),
    ),
    notifiedVolunteerIds: z.array(z.uuid()),
    notifiedCount: z.number().int(),
  }),
);

const acceptRequestResponseSchema = requestActionResponseSchema(
  z.object({
    requestId: z.uuid(),
    accepted: z.number().int(),
    needed: z.number().int(),
    isFull: z.boolean(),
  }),
);

const proceedWithAcceptedResponseSchema = requestActionResponseSchema(
  z.object({
    requestId: z.uuid(),
    volunteersConfirmed: z.number().int(),
    expiredVolunteerIds: z.array(z.uuid()),
  }),
);

const startRequestResponseSchema = requestActionResponseSchema(
  z.object({
    requestId: z.uuid(),
    startedAt: z.iso.datetime(),
    requestStarted: z.boolean(),
  }),
);

const declineRequestResponseSchema = requestActionResponseSchema(
  z.object({
    requestId: z.uuid(),
    action: z.enum(["declined", "cancelled"]),
    reopened: z.boolean(),
    completed: z.boolean(),
    notified: z.array(z.uuid()),
  }),
);

const completeRequestResponseSchema = requestActionResponseSchema(
  z.object({
    requestId: z.uuid(),
    requestCompleted: z.boolean(),
    remainingVolunteers: z.number().int(),
    expiredVolunteerIds: z.array(z.uuid()),
  }),
);

const cancelRequestResponseSchema = requestActionResponseSchema(
  z.object({
    requestId: z.uuid(),
    status: z.literal("cancelled"),
    releasedVolunteerIds: z.array(z.uuid()),
    expiredVolunteerIds: z.array(z.uuid()),
  }),
);

const chatHistoryResponseSchema = requestActionResponseSchema(
  z.object({
    requestId: z.uuid(),
    messages: z.array(
      z.object({
        id: z.uuid(),
        requestId: z.uuid(),
        senderId: z.uuid().nullable(),
        senderFirstName: z.string().nullable(),
        senderLastName: z.string().nullable(),
        body: z.string(),
        createdAt: z.iso.datetime(),
      }),
    ),
    hasMore: z.boolean(),
    nextBefore: z.iso.datetime().nullable(),
  }),
);

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

registry.registerPath({
  method: "post",
  path: "/request/{requestId}/volunteers",
  tags: ["Request"],
  summary: "Find volunteers for a request",
  description:
    "Finds currently available volunteers within the request's broadcast radius, " +
    "updates the request's volunteer broadcasts, and returns the volunteers who were notified. " +
    "Only the user who created the request can trigger or repeat the search.",
  security: [{ bearerAuth: [] }],
  request: {
    params: requestIdParamsSchema,
  },
  responses: {
    200: {
      description: "Volunteers fetched successfully",
      content: {
        "application/json": {
          schema: volunteersForRequestResponseSchema,
        },
      },
    },
    ...commonErrorResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/request/{requestId}/accept",
  tags: ["Request"],
  summary: "Accept a request as a volunteer",
  description:
    "Accepts a request that was broadcast to the authenticated volunteer. " +
    "The volunteer must be available and within the request's broadcast radius. " +
    "Acceptance is rejected when all volunteer slots are filled or the request has expired.",
  security: [{ bearerAuth: [] }],
  request: {
    params: requestIdParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: acceptRequestBodySchema,
          example: { lat: 22.5726, lng: 88.3639 },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Request accepted successfully",
      content: {
        "application/json": {
          schema: acceptRequestResponseSchema,
        },
      },
    },
    ...commonErrorResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/request/{requestId}/proceed",
  tags: ["Request"],
  summary: "Proceed with accepted volunteers",
  description:
    "Confirms the volunteers who have accepted so far, even if some requested slots remain open, " +
    "and expires all pending volunteer broadcasts. Only the request's owner can proceed, and at least one volunteer must have accepted.",
  security: [{ bearerAuth: [] }],
  request: {
    params: requestIdParamsSchema,
  },
  responses: {
    200: {
      description: "Request will proceed with accepted volunteers",
      content: {
        "application/json": {
          schema: proceedWithAcceptedResponseSchema,
        },
      },
    },
    ...commonErrorResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/request/{requestId}/start",
  tags: ["Request"],
  summary: "Start an accepted request",
  description:
    "Marks the authenticated volunteer's active assignment as started. " +
    "The request must be accepted, and the volunteer must have an active assignment for it.",
  security: [{ bearerAuth: [] }],
  request: {
    params: requestIdParamsSchema,
  },
  responses: {
    200: {
      description: "Request started successfully",
      content: {
        "application/json": {
          schema: startRequestResponseSchema,
        },
      },
    },
    ...commonErrorResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/request/{requestId}/decline",
  tags: ["Request"],
  summary: "Decline or cancel a volunteer assignment",
  description:
    "Declines a pending broadcast or cancels the authenticated volunteer's active assignment. " +
    "If an assignment is cancelled, the request may be reopened and nearby volunteers notified.",
  security: [{ bearerAuth: [] }],
  request: {
    params: requestIdParamsSchema,
  },
  responses: {
    200: {
      description: "Request declined successfully",
      content: {
        "application/json": {
          schema: declineRequestResponseSchema,
        },
      },
    },
    ...commonErrorResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/request/{requestId}/complete",
  tags: ["Request"],
  summary: "Complete a request assignment",
  description:
    "Marks the authenticated volunteer's active assignment as complete. " +
    "The request is marked complete once all active assignments are finished.",
  security: [{ bearerAuth: [] }],
  request: {
    params: requestIdParamsSchema,
  },
  responses: {
    200: {
      description: "Request completed successfully",
      content: {
        "application/json": {
          schema: completeRequestResponseSchema,
        },
      },
    },
    ...commonErrorResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/request/{requestId}/cancel",
  tags: ["Request"],
  summary: "Cancel a request",
  description:
    "Cancels a request created by the authenticated user, releases its active volunteer assignments, " +
    "and expires pending volunteer broadcasts.",
  security: [{ bearerAuth: [] }],
  request: {
    params: requestIdParamsSchema,
  },
  responses: {
    200: {
      description: "Request canceled successfully",
      content: {
        "application/json": {
          schema: cancelRequestResponseSchema,
        },
      },
    },
    ...commonErrorResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/request/{requestId}/chat/history",
  tags: ["Request"],
  summary: "Fetch request chat history",
  description:
    "Returns chat messages in chronological order for the requester and accepted volunteers. " +
    "Use `nextBefore` as the `before` query parameter to fetch older messages. " +
    "Live chat uses Socket.IO authenticated with the existing `auth.token`; the room id is the request UUID. " +
    "Events: `chat:join` and `chat:leave` accept `{ requestId }`; `chat:message` accepts " +
    "`{ requestId, body }` (1-4000 characters). The requester is enrolled on request creation and " +
    "each volunteer is enrolled and joined on acceptance. A volunteer's `chat:leave` is permanent; " +
    "completed, cancelled, and expired requests close the room.",
  security: [{ bearerAuth: [] }],
  request: {
    params: requestIdParamsSchema,
    query: chatHistoryQuerySchema,
  },
  responses: {
    200: {
      description: "Chat history fetched successfully",
      content: {
        "application/json": {
          schema: chatHistoryResponseSchema,
        },
      },
    },
    ...commonErrorResponses,
  },
});
