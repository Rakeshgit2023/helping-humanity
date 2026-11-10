import z from "zod";
import { commonErrorResponses } from "../../comman/dto/response.dto.js";
import { allowedMimeTypes } from "../../comman/middleware/upload.middleware.js";
import {
  createRequestResponseSchema,
  createRequestSchema,
} from "../../module/request/dto/createRequest.dto.js";
import { registry } from "../registry.js";
import { requestIdParamSchema } from "../../module/request/dto/requestIdParam.dto.js";
import { acceptRequestBodySchema } from "../../module/request/dto/acceptRequest.dto.js";
import { broadcastListQuerySchema } from "../../module/request/dto/broadcastListQuery.dto.js";

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

// NOTE: ApiResponse.ok(res, message, data) wrapper shape is assumed to be
// { success, message, data }. Adjust `wrap` if your ApiResponse differs.
const wrap = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    data,
  });

const uuid = z.string().uuid();
const bearer = [{ bearerAuth: [] }];

const jsonResponse = (description: string, data: z.ZodTypeAny) => ({
  200: {
    description,
    content: { "application/json": { schema: wrap(data) } },
  },
  ...commonErrorResponses,
});

// ---------- POST /request/{requestId}/volunteers ----------
registry.registerPath({
  method: "post",
  path: "/request/{requestId}/volunteers",
  tags: ["Request"],
  summary: "Find nearby volunteers and broadcast the request",
  description:
    "Only the requester can call this. Finds volunteers inside the request's broadcast radius " +
    "(latest location, banned and already-busy volunteers excluded), expires broadcasts of " +
    "volunteers who moved out of range, and (re)notifies new ones. Declined volunteers are not returned. " +
    "Request must be in `broadcasted` status and not expired.",
  security: bearer,
  request: { params: requestIdParamSchema },
  responses: jsonResponse(
    "Volunteers fetched successfully",
    z.object({
      request: z.object({
        id: uuid,
        requesterId: uuid,
        status: z.string(),
        expiresAt: z.string().datetime().nullable(),
        lat: z.number(),
        lng: z.number(),
        address: z.string().nullable(),
        broadcastRadiusKm: z.number(),
      }),
      volunteers: z.array(
        z.object({
          volunteerId: uuid,
          firstName: z.string(),
          lastName: z.string().nullable(),
          lat: z.number(),
          lng: z.number(),
          recordedAt: z.string().datetime(),
          distanceKm: z.number(),
        }),
      ),
      notifiedVolunteerIds: z.array(uuid),
      notifiedCount: z.number().int(),
    }),
  ),
});

// ---------- POST /request/{requestId}/accept ----------
registry.registerPath({
  method: "post",
  path: "/request/{requestId}/accept",
  tags: ["Request"],
  summary: "Accept a request (volunteer)",
  description:
    "Volunteer accepts a broadcasted request. Send the volunteer's current location in the body; " +
    "it is saved and checked against the request's broadcast radius. " +
    "Fails if the volunteer is unavailable, wasn't sent the broadcast, is too far, " +
    "already has an active request, or all slots are filled. " +
    "When the last slot is filled the request becomes `accepted`.",
  security: bearer,
  request: {
    params: requestIdParamSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: acceptRequestBodySchema.omit({ requestId: true }),
          example: { lat: 22.5726, lng: 88.3639 },
        },
      },
    },
  },
  responses: jsonResponse(
    "Request accepted successfully",
    z.object({
      requestId: uuid,
      accepted: z.number().int().openapi({ description: "Slots taken so far" }),
      needed: z.number().int(),
      isFull: z.boolean(),
    }),
  ),
});

// ---------- POST /request/{requestId}/proceed ----------
registry.registerPath({
  method: "post",
  path: "/request/{requestId}/proceed",
  tags: ["Request"],
  summary: "Proceed with the volunteers who already accepted",
  description:
    "Only the requester can call this. Requires at least one accepted volunteer. " +
    "Sets the request to `accepted`, reduces `totalVolunteersNeeded` to the accepted count " +
    "and expires all pending broadcasts.",
  security: bearer,
  request: { params: requestIdParamSchema },
  responses: jsonResponse(
    "Request will proceed with accepted volunteers",
    z.object({
      requestId: uuid,
      volunteersConfirmed: z.number().int(),
      expiredVolunteerIds: z.array(uuid),
    }),
  ),
});

// ---------- POST /request/{requestId}/start ----------
registry.registerPath({
  method: "post",
  path: "/request/{requestId}/start",
  tags: ["Request"],
  summary: "Start work on a request (volunteer)",
  description:
    "The volunteer must have an active assignment. Not allowed while the request is still " +
    "`broadcasted` (waiting for slots). The first volunteer to start moves the request to `in_progress`.",
  security: bearer,
  request: { params: requestIdParamSchema },
  responses: jsonResponse(
    "Request started successfully",
    z.object({
      requestId: uuid,
      startedAt: z.string().datetime(),
      requestStarted: z.boolean(),
    }),
  ),
});

// ---------- POST /request/{requestId}/decline ----------
registry.registerPath({
  method: "post",
  path: "/request/{requestId}/decline",
  tags: ["Request"],
  summary: "Decline a request, or cancel an already accepted one (volunteer)",
  description:
    "If the volunteer had not accepted, the broadcast is marked `declined` (`action: declined`). " +
    "If they had accepted, their assignment is cancelled (`action: cancelled`) and the request " +
    "may be reopened and re-broadcast, or marked completed if someone already finished.",
  security: bearer,
  request: { params: requestIdParamSchema },
  responses: jsonResponse(
    "Request declined successfully",
    z.object({
      requestId: uuid,
      action: z.enum(["declined", "cancelled"]),
      reopened: z.boolean(),
      completed: z.boolean(),
      notified: z.array(uuid).openapi({
        description: "Volunteer ids to push-notify (when reopened)",
      }),
    }),
  ),
});

// ---------- POST /request/{requestId}/complete ----------
registry.registerPath({
  method: "post",
  path: "/request/{requestId}/complete",
  tags: ["Request"],
  summary: "Mark own assignment as complete (volunteer)",
  description:
    "Request must be `accepted` or `in_progress`. The request becomes `completed` once " +
    "no active volunteers remain; otherwise it stays/moves to `in_progress`.",
  security: bearer,
  request: { params: requestIdParamSchema },
  responses: jsonResponse(
    "Request completed successfully",
    z.object({
      requestId: uuid,
      requestCompleted: z.boolean(),
      remainingVolunteers: z.number().int(),
      expiredVolunteerIds: z.array(uuid),
    }),
  ),
});

// ---------- POST /request/{requestId}/cancel ----------
registry.registerPath({
  method: "post",
  path: "/request/{requestId}/cancel",
  tags: ["Request"],
  summary: "Cancel a request (requester)",
  description:
    "Only the requester can cancel. Not allowed if already completed, cancelled or expired. " +
    "Active volunteers are released and pending broadcasts expire.",
  security: bearer,
  request: { params: requestIdParamSchema },
  responses: jsonResponse(
    "Request canceled successfully",
    z.object({
      requestId: uuid,
      status: z.literal("cancelled"),
      releasedVolunteerIds: z.array(uuid),
      expiredVolunteerIds: z.array(uuid),
    }),
  ),
});

// ---------- GET /request/my-broadcasts ----------
registry.registerPath({
  method: "get",
  path: "/request/my-broadcasts",
  tags: ["Request"],
  summary: "List requests broadcasted to me (volunteer)",
  description:
    "Volunteer's own broadcast list, newest first. `status=pending` (default) returns only requests " +
    "that can still be accepted: broadcast is `sent`/`seen`, request is `broadcasted` and not expired. " +
    "`status=all` returns every broadcast of this volunteer including accepted, declined and expired ones.",
  security: bearer,
  request: { query: broadcastListQuerySchema },
  responses: jsonResponse(
    "Broadcasts fetched successfully",
    z.array(
      z.object({
        broadcastId: uuid,
        broadcastStatus: z.enum([
          "sent",
          "seen",
          "accepted",
          "declined",
          "expired",
        ]),
        distanceKm: z.number().nullable(),
        notifiedAt: z.string().datetime(),
        requestId: uuid,
        title: z.string(),
        description: z.string().nullable(),
        address: z.string().nullable(),
        lat: z.number(),
        lng: z.number(),
        priority: z.enum(["normal", "high", "urgent"]),
        requestStatus: z.string(),
        bloodGroupNeeded: z.string().nullable(),
        hospitalName: z.string().nullable(),
        totalVolunteersNeeded: z.number().int(),
        expiresAt: z.string().datetime().nullable(),
        createdAt: z.string().datetime(),
      }),
    ),
  ),
});

// ---------- GET /request/{requestId} ----------
registry.registerPath({
  method: "get",
  path: "/request/{requestId}",
  tags: ["Request"],
  summary: "Get request detail",
  description:
    "Requester can see their own request. A volunteer can see it only if the request was broadcasted " +
    "to them (otherwise 404). Admin can see any request. `requesterId` is never returned. " +
    "`myBroadcastStatus` and `myAssignment` are for the calling volunteer and are `null` when not applicable.",
  security: bearer,
  request: { params: requestIdParamSchema },
  responses: jsonResponse(
    "Request fetched successfully",
    z.object({
      id: uuid,
      title: z.string(),
      description: z.string().nullable(),
      address: z.string().nullable(),
      lat: z.number(),
      lng: z.number(),
      priority: z.enum(["normal", "high", "urgent"]),
      status: z.string(),
      bloodGroupNeeded: z.string().nullable(),
      hospitalName: z.string().nullable(),
      broadcastRadiusKm: z.number(),
      totalVolunteersNeeded: z.number().int(),
      expiresAt: z.string().datetime().nullable(),
      createdAt: z.string().datetime(),
      photos: z.array(z.string().url()),
      isRequester: z.boolean(),
      myBroadcastStatus: z
        .enum(["sent", "seen", "accepted", "declined", "expired"])
        .nullable(),
      myAssignment: z
        .object({
          acceptedAt: z.string().datetime(),
          inProgressAt: z.string().datetime().nullable(),
        })
        .nullable(),
    }),
  ),
});
