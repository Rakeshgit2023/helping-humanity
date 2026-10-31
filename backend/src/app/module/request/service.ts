import { eq, ne, and } from "drizzle-orm/sql/expressions/conditions";
import { db } from "../../../db/index.js";
import {
  requestBroadcasts,
  requestPhotos,
  requests,
  userLocations,
  users,
  volunteerProfiles,
} from "../../../db/schema.js";
import { withErrorHandling } from "../../comman/middleware/withErrorHandling.js";
import ApiError from "../../comman/utils/api.error.js";
import type { User } from "../../comman/utils/jwt.js";
import {
  deleteFilesFromCloudinary,
  uploadFilesToCloudinary,
} from "../../comman/utils/uploadFilesToCloudinary.js";
import type { CreateRequestInput } from "./dto/createRequest.dto.js";
import type { VolunteersForRequestInput } from "./dto/volunteersForRequest.dto.js";
import { desc } from "drizzle-orm/sql/expressions/select";
import { sql } from "drizzle-orm/sql/sql";

export const createRequest = withErrorHandling(
  "Create Request for user",
  async (
    {
      category,
      title,
      description,
      lat,
      lng,
      address,
      bloodGroupNeeded,
      hospitalName,
      expiresAt,
      priority,
      broadcastRadiusKm,
      totalVolunteersNeeded,
    }: CreateRequestInput,
    { id }: User,
    files: Express.Multer.File[] = [],
  ) => {
    const uploadedFiles = await uploadFilesToCloudinary(files);

    try {
      return await db.transaction(async (tx) => {
        const [newRequest] = await tx
          .insert(requests)
          .values({
            requesterId: id,
            categoryId: category.id,
            title,
            description: description ?? null,
            lat,
            lng,
            ...(address && { address }),
            ...(bloodGroupNeeded && { bloodGroupNeeded }),
            ...(hospitalName && { hospitalName }),
            priority,
            broadcastRadiusKm,
            totalVolunteersNeeded,
            ...(expiresAt && { expiresAt: new Date(expiresAt) }),
          })
          .returning({
            id: requests.id,
            title: requests.title,
            description: requests.description,
            categoryId: requests.categoryId,
            lat: requests.lat,
            lng: requests.lng,
            address: requests.address,
            bloodGroupNeeded: requests.bloodGroupNeeded,
            hospitalName: requests.hospitalName,
            priority: requests.priority,
            status: requests.status,
            broadcastRadiusKm: requests.broadcastRadiusKm,
            totalVolunteersNeeded: requests.totalVolunteersNeeded,
            expiresAt: requests.expiresAt,
            createdAt: requests.createdAt,
          });

        if (!newRequest) {
          throw ApiError.internal("Failed to create request");
        }

        if (uploadedFiles.length > 0) {
          await tx.insert(requestPhotos).values(
            uploadedFiles.map((file) => ({
              requestId: newRequest.id,
              photoUrl: file.url,
            })),
          );
        }

        return newRequest;
      });
    } catch (error) {
      await deleteFilesFromCloudinary(uploadedFiles);
      throw error;
    }
  },
);

// ---------- 1. Volunteers dhundho (pehle wala logic, helper bana diya) ----------
const findNearbyVolunteers = async (
  existingRequest: {
    lat: number;
    lng: number;
    broadcastRadiusKm: number;
  },
  user: User,
) => {
  const latestLocation = db
    .selectDistinctOn([userLocations.userId], {
      userId: userLocations.userId,
      lat: userLocations.lat,
      lng: userLocations.lng,
      recordedAt: userLocations.recordedAt,
    })
    .from(userLocations)
    .innerJoin(users, eq(users.id, userLocations.userId))
    .where(eq(users.role, "volunteer"))
    .orderBy(userLocations.userId, desc(userLocations.recordedAt))
    .as("latest_location");

  const distanceKm = sql<number>`
    6371 * acos(least(1, greatest(-1,
      cos(radians(${existingRequest.lat})) * cos(radians(${latestLocation.lat}))
      * cos(radians(${latestLocation.lng}) - radians(${existingRequest.lng}))
      + sin(radians(${existingRequest.lat})) * sin(radians(${latestLocation.lat}))
    )))
  `;

  const conditions = [
    // eq(volunteerProfiles.isAvailable, true),
    sql`${distanceKm} <= ${existingRequest.broadcastRadiusKm}`,
  ];

  // Volunteer ne request raise ki hai to us volunteer ko exclude karo
  if (user.role === "volunteer") {
    conditions.push(ne(volunteerProfiles.userId, user.id));
  }

  return db
    .select({
      volunteerId: volunteerProfiles.userId,
      firstName: users.firstName,
      lastName: users.lastName,
      lat: latestLocation.lat,
      lng: latestLocation.lng,
      recordedAt: latestLocation.recordedAt,
      distanceKm,
    })
    .from(volunteerProfiles)
    .innerJoin(users, eq(users.id, volunteerProfiles.userId))
    .innerJoin(
      latestLocation,
      eq(latestLocation.userId, volunteerProfiles.userId),
    )
    .where(and(...conditions))
    .orderBy(distanceKm);
};

// ---------- 2. Find + requestBroadcasts me store ----------
export const volunteersForRequest = withErrorHandling(
  "Find Volunteers for request",
  async ({ requestId }: VolunteersForRequestInput, user: User) => {
    const [existingRequest] = await db
      .select({
        id: requests.id,
        lat: requests.lat,
        lng: requests.lng,
        address: requests.address,
        broadcastRadiusKm: requests.broadcastRadiusKm,
      })
      .from(requests)
      .where(eq(requests.id, requestId))
      .limit(1);

    if (!existingRequest) {
      throw ApiError.notFound("Request not found");
    }

    const volunteers = await findNearbyVolunteers(existingRequest, user);

    // Koi volunteer nahi mila to insert mat karo (drizzle empty values par error deta hai)
    if (volunteers.length === 0) {
      return { request: existingRequest, volunteers: [], broadcastedCount: 0 };
    }

    const inserted = await db
      .insert(requestBroadcasts)
      .values(
        volunteers.map((v) => ({
          requestId: existingRequest.id,
          volunteerId: v.volunteerId,
          distanceKm: Number(v.distanceKm),
          // status default "sent" hai, notifiedAt default now() hai
        })),
      )
      .onConflictDoNothing({
        target: [requestBroadcasts.requestId, requestBroadcasts.volunteerId],
      })
      .returning({
        volunteerId: requestBroadcasts.volunteerId,
      });

    return {
      request: existingRequest,
      volunteers,
      broadcastedCount: inserted.length,
    };
  },
);
