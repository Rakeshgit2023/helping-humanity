// import {
//   eq,
//   ne,
//   and,
//   isNull,
//   inArray,
//   notInArray,
//   isNotNull,
// } from "drizzle-orm/sql/expressions/conditions";
// import { db } from "../../../db/index.js";
// import {
//   requestAssignments,
//   requestBroadcasts,
//   requestPhotos,
//   requests,
//   userLocations,
//   users,
//   volunteerProfiles,
// } from "../../../db/schema.js";
// import { withErrorHandling } from "../../comman/middleware/withErrorHandling.js";
// import ApiError from "../../comman/utils/api.error.js";
// import type { User } from "../../comman/utils/jwt.js";
// import {
//   deleteFilesFromCloudinary,
//   uploadFilesToCloudinary,
// } from "../../comman/utils/uploadFilesToCloudinary.js";
// import type { CreateRequestInput } from "./dto/createRequest.dto.js";
// import { desc } from "drizzle-orm/sql/expressions/select";
// import { sql } from "drizzle-orm/sql/sql";
// import { count } from "drizzle-orm/sql/functions/aggregate";
// import type { RequestIdParamInput } from "./dto/requestIdParam.dto.js";

// type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// export const createRequest = withErrorHandling(
//   "Create Request for user",
//   async (
//     {
//       category,
//       title,
//       description,
//       lat,
//       lng,
//       address,
//       bloodGroupNeeded,
//       hospitalName,
//       expiresAt,
//       priority,
//       broadcastRadiusKm,
//       totalVolunteersNeeded,
//     }: CreateRequestInput,
//     { id }: User,
//     files: Express.Multer.File[] = [],
//   ) => {
//     const uploadedFiles = await uploadFilesToCloudinary(files);

//     try {
//       return await db.transaction(async (tx) => {
//         const [newRequest] = await tx
//           .insert(requests)
//           .values({
//             requesterId: id,
//             categoryId: category.id,
//             title,
//             description: description ?? null,
//             lat,
//             lng,
//             ...(address && { address }),
//             ...(bloodGroupNeeded && { bloodGroupNeeded }),
//             ...(hospitalName && { hospitalName }),
//             priority,
//             broadcastRadiusKm,
//             totalVolunteersNeeded,
//             ...(expiresAt && { expiresAt: new Date(expiresAt) }),
//           })
//           .returning({
//             id: requests.id,
//             title: requests.title,
//             description: requests.description,
//             categoryId: requests.categoryId,
//             lat: requests.lat,
//             lng: requests.lng,
//             address: requests.address,
//             bloodGroupNeeded: requests.bloodGroupNeeded,
//             hospitalName: requests.hospitalName,
//             priority: requests.priority,
//             status: requests.status,
//             broadcastRadiusKm: requests.broadcastRadiusKm,
//             totalVolunteersNeeded: requests.totalVolunteersNeeded,
//             expiresAt: requests.expiresAt,
//             createdAt: requests.createdAt,
//           });

//         if (!newRequest) {
//           throw ApiError.internal("Failed to create request");
//         }

//         if (uploadedFiles.length > 0) {
//           await tx.insert(requestPhotos).values(
//             uploadedFiles.map((file) => ({
//               requestId: newRequest.id,
//               photoUrl: file.url,
//             })),
//           );
//         }

//         return newRequest;
//       });
//     } catch (error) {
//       await deleteFilesFromCloudinary(uploadedFiles);
//       throw error;
//     }
//   },
// );

// // ---------- 1. Nearby volunteers (latest location, sirf role = volunteer) ----------
// const findNearbyVolunteers = async (
//   tx: Tx,
//   point: { lat: number; lng: number; radiusKm: number },
//   excludeUserId?: string,
// ) => {
//   const latestLocation = tx
//     .selectDistinctOn([userLocations.userId], {
//       userId: userLocations.userId,
//       lat: userLocations.lat,
//       lng: userLocations.lng,
//       recordedAt: userLocations.recordedAt,
//     })
//     .from(userLocations)
//     .innerJoin(users, eq(users.id, userLocations.userId))
//     .where(eq(users.role, "volunteer"))
//     .orderBy(userLocations.userId, desc(userLocations.recordedAt))
//     .as("latest_location");

//   const distanceKm = sql<number>`
//     6371 * acos(least(1, greatest(-1,
//       cos(radians(${point.lat})) * cos(radians(${latestLocation.lat}))
//       * cos(radians(${latestLocation.lng}) - radians(${point.lng}))
//       + sin(radians(${point.lat})) * sin(radians(${latestLocation.lat}))
//     )))
//   `;

//   const conditions = [
//     sql`${distanceKm} <= ${point.radiusKm}`,
//     eq(users.isBanned, false), // banned volunteers ko alert nahi
//   ];
//   if (excludeUserId) {
//     conditions.push(ne(users.id, excludeUserId));
//   }

//   return tx
//     .select({
//       volunteerId: users.id,
//       firstName: users.firstName,
//       lastName: users.lastName,
//       lat: latestLocation.lat,
//       lng: latestLocation.lng,
//       recordedAt: latestLocation.recordedAt,
//       distanceKm,
//     })
//     .from(latestLocation)
//     .innerJoin(users, eq(users.id, latestLocation.userId))
//     .where(and(...conditions))
//     .orderBy(distanceKm);
// };

// // ---------- 2. Find + broadcast (pehli baar bhi, decline ke baad bhi) ----------
// export const volunteersForRequest = withErrorHandling(
//   "Find Volunteers for request",
//   async ({ requestId }: RequestIdParamInput, user: User) => {
//     return db.transaction(async (tx) => {
//       // Lock: accept/decline ke saath race na ho
//       const [request] = await tx
//         .select({
//           id: requests.id,
//           requesterId: requests.requesterId,
//           status: requests.status,
//           expiresAt: requests.expiresAt,
//           lat: requests.lat,
//           lng: requests.lng,
//           address: requests.address,
//           broadcastRadiusKm: requests.broadcastRadiusKm,
//         })
//         .from(requests)
//         .where(eq(requests.id, requestId))
//         .limit(1)
//         .for("update");

//       if (!request) throw ApiError.notFound("Request not found");

//       // Sirf request raise karne wala hi broadcast trigger kare
//       if (request.requesterId !== user.id) {
//         throw ApiError.badRequest("This is not your request");
//       }

//       // accepted / in_progress me naye volunteers ki zaroorat nahi
//       if (request.status !== "broadcasted") {
//         throw ApiError.badRequest(
//           `Request is ${request.status}, volunteers cannot be searched now`,
//         );
//       }

//       if (request.expiresAt && request.expiresAt <= new Date()) {
//         throw ApiError.badRequest("Request has expired");
//       }

//       // Latest location se ABHI ke nearby volunteers (requester excluded)
//       const nearby = await findNearbyVolunteers(
//         tx,
//         {
//           lat: request.lat,
//           lng: request.lng,
//           radiusKm: request.broadcastRadiusKm,
//         },
//         request.requesterId,
//       );

//       const nearbyIds = nearby.map((v) => v.volunteerId);

//       // A. sent/seen the par ab radius ke bahar hain -> expired
//       const expireConditions = [
//         eq(requestBroadcasts.requestId, request.id),
//         inArray(requestBroadcasts.status, ["sent", "seen"]),
//       ];
//       if (nearbyIds.length > 0) {
//         expireConditions.push(
//           notInArray(requestBroadcasts.volunteerId, nearbyIds),
//         );
//       }

//       await tx
//         .update(requestBroadcasts)
//         .set({ status: "expired" })
//         .where(and(...expireConditions));

//       const volunteers = nearby.map((v) => ({
//         ...v,
//         distanceKm: Number(Number(v.distanceKm).toFixed(2)),
//       }));

//       if (nearbyIds.length === 0) {
//         return {
//           request,
//           volunteers,
//           notifiedVolunteerIds: [] as string[],
//           notifiedCount: 0,
//         };
//       }

//       // B. Naye volunteers insert, "expired + bina response" wale wapas "sent".
//       //    declined / accepted / sent / seen rows touch nahi hoti.
//       const notified = await tx
//         .insert(requestBroadcasts)
//         .values(
//           nearby.map((v) => ({
//             requestId: request.id,
//             volunteerId: v.volunteerId,
//             distanceKm: Number(v.distanceKm),
//           })),
//         )
//         .onConflictDoUpdate({
//           target: [requestBroadcasts.requestId, requestBroadcasts.volunteerId],
//           set: {
//             status: "sent",
//             distanceKm: sql`excluded.distance_km`,
//             notifiedAt: new Date(),
//           },
//           setWhere: sql`${requestBroadcasts.status} = 'expired' and ${requestBroadcasts.respondedAt} is null`,
//         })
//         .returning({ volunteerId: requestBroadcasts.volunteerId });

//       const notifiedVolunteerIds = notified.map((r) => r.volunteerId);

//       return {
//         request,
//         volunteers, // abhi radius ke andar sab
//         notifiedVolunteerIds, // sirf inhe push bhejo
//         notifiedCount: notifiedVolunteerIds.length,
//       };
//     });
//   },
// );

// const countTakenSlots = async (tx: Tx, requestId: string): Promise<number> => {
//   const [row] = await tx
//     .select({ taken: count() })
//     .from(requestAssignments)
//     .where(
//       and(
//         eq(requestAssignments.requestId, requestId),
//         isNull(requestAssignments.cancelledAt),
//       ),
//     );

//   return row?.taken ?? 0;
// };

// export const acceptRequest = withErrorHandling(
//   "Accept request",
//   async ({ requestId }: RequestIdParamInput, user: User) => {
//     return db.transaction(async (tx) => {
//       // 1. Request row lock: is request par accept/decline ek-ek karke chalenge
//       const [request] = await tx
//         .select({
//           id: requests.id,
//           requesterId: requests.requesterId,
//           status: requests.status,
//           expiresAt: requests.expiresAt,
//           totalVolunteersNeeded: requests.totalVolunteersNeeded,
//         })
//         .from(requests)
//         .where(eq(requests.id, requestId))
//         .for("update");

//       if (!request) throw ApiError.notFound("Request not found");

//       if (request.requesterId === user.id) {
//         throw ApiError.badRequest("You cannot accept your own request");
//       }
//       if (request.status !== "broadcasted") {
//         throw ApiError.badRequest(
//           request.status === "accepted"
//             ? "This request already has enough volunteers"
//             : `Request is ${request.status}`,
//         );
//       }
//       if (request.expiresAt && request.expiresAt < new Date()) {
//         throw ApiError.badRequest("Request has expired");
//       }

//       // 2. Volunteer available hona chahiye
//       const [profile] = await tx
//         .select({ isAvailable: volunteerProfiles.isAvailable })
//         .from(volunteerProfiles)
//         .where(eq(volunteerProfiles.userId, user.id));

//       if (!profile?.isAvailable) {
//         throw ApiError.badRequest("Turn on availability to accept requests");
//       }

//       // 3. Is volunteer ko broadcast mila hona chahiye aur abhi pending ho
//       const [broadcast] = await tx
//         .select({ status: requestBroadcasts.status })
//         .from(requestBroadcasts)
//         .where(
//           and(
//             eq(requestBroadcasts.requestId, requestId),
//             eq(requestBroadcasts.volunteerId, user.id),
//           ),
//         );

//       if (!broadcast) {
//         throw ApiError.badRequest("This request was not sent to you");
//       }
//       if (!["sent", "seen"].includes(broadcast.status)) {
//         throw ApiError.badRequest(
//           `You cannot accept (status: ${broadcast.status})`,
//         );
//       }

//       // 4. Volunteer ki koi aur active request to nahi (accepted / in_progress)
//       const [active] = await tx
//         .select({ requestId: requestAssignments.requestId })
//         .from(requestAssignments)
//         .where(
//           and(
//             eq(requestAssignments.volunteerId, user.id),
//             isNull(requestAssignments.completedAt),
//             isNull(requestAssignments.cancelledAt),
//           ),
//         )
//         .limit(1);

//       if (active) {
//         throw ApiError.badRequest("You already have an active request");
//       }

//       // 5. Slot khali hai ya nahi
//       const taken = await countTakenSlots(tx, requestId);
//       if (taken >= request.totalVolunteersNeeded) {
//         throw ApiError.badRequest("This request already has enough volunteers");
//       }

//       // 6. Assignment + broadcast status
//       await tx.insert(requestAssignments).values({
//         requestId,
//         volunteerId: user.id,
//       });

//       await tx
//         .update(requestBroadcasts)
//         .set({ status: "accepted", respondedAt: new Date() })
//         .where(
//           and(
//             eq(requestBroadcasts.requestId, requestId),
//             eq(requestBroadcasts.volunteerId, user.id),
//           ),
//         );

//       // 7. Sab slots bhar gaye to request "accepted", baaki broadcasts "expired"
//       const nowTaken = taken + 1;
//       const isFull = nowTaken >= request.totalVolunteersNeeded;

//       if (isFull) {
//         await tx
//           .update(requests)
//           .set({ status: "accepted" })
//           .where(eq(requests.id, requestId));

//         await tx
//           .update(requestBroadcasts)
//           .set({ status: "expired" })
//           .where(
//             and(
//               eq(requestBroadcasts.requestId, requestId),
//               inArray(requestBroadcasts.status, ["sent", "seen"]),
//             ),
//           );
//       }

//       return {
//         requestId,
//         accepted: nowTaken,
//         needed: request.totalVolunteersNeeded,
//         isFull,
//       };
//     });
//   },
// );

// export const startRequest = withErrorHandling(
//   "Start request",
//   async ({ requestId }: RequestIdParamInput, user: User) => {
//     return db.transaction(async (tx) => {
//       // 1. Lock
//       const [request] = await tx
//         .select({
//           id: requests.id,
//           status: requests.status,
//           expiresAt: requests.expiresAt,
//         })
//         .from(requests)
//         .where(eq(requests.id, requestId))
//         .for("update");

//       if (!request) throw ApiError.notFound("Request not found");

//       if (
//         !["broadcasted", "accepted", "in_progress"].includes(request.status)
//       ) {
//         throw ApiError.badRequest(`Request is ${request.status}`);
//       }

//       // 2. Is volunteer ki active assignment honi chahiye
//       const [assignment] = await tx
//         .select({ inProgressAt: requestAssignments.inProgressAt })
//         .from(requestAssignments)
//         .where(
//           and(
//             eq(requestAssignments.requestId, requestId),
//             eq(requestAssignments.volunteerId, user.id),
//             isNull(requestAssignments.completedAt),
//             isNull(requestAssignments.cancelledAt),
//           ),
//         );

//       if (!assignment) {
//         throw ApiError.badRequest("You have not accepted this request");
//       }
//       if (assignment.inProgressAt) {
//         throw ApiError.badRequest("You have already started this request");
//       }

//       const now = new Date();

//       // 3. Is volunteer ki assignment in_progress
//       await tx
//         .update(requestAssignments)
//         .set({ inProgressAt: now })
//         .where(
//           and(
//             eq(requestAssignments.requestId, requestId),
//             eq(requestAssignments.volunteerId, user.id),
//           ),
//         );

//       // 4. Pehla volunteer start kare to request in_progress
//       let requestStarted = false;
//       let expiredVolunteerIds: string[] = [];

//       if (request.status !== "in_progress") {
//         await tx
//           .update(requests)
//           .set({ status: "in_progress" })
//           .where(eq(requests.id, requestId));

//         // Naye volunteers nahi chahiye: pending broadcasts expire
//         const expired = await tx
//           .update(requestBroadcasts)
//           .set({ status: "expired" })
//           .where(
//             and(
//               eq(requestBroadcasts.requestId, requestId),
//               inArray(requestBroadcasts.status, ["sent", "seen"]),
//             ),
//           )
//           .returning({ volunteerId: requestBroadcasts.volunteerId });

//         expiredVolunteerIds = expired.map((r) => r.volunteerId);
//         requestStarted = true;
//       }

//       return {
//         requestId,
//         startedAt: now,
//         requestStarted,
//         expiredVolunteerIds,
//       };
//     });
//   },
// );

// type BroadcastRequest = {
//   id: string;
//   lat: number;
//   lng: number;
//   broadcastRadiusKm: number;
//   requesterId: string;
// };

// // Nearby volunteers dhundho aur request_broadcasts me upsert karo.
// // Naye volunteers insert hote hain, "expired + bina response" wale wapas "sent" hote hain.
// // declined / accepted / sent / seen rows touch nahi hoti.
// const broadcastToNearby = async (tx: Tx, request: BroadcastRequest) => {
//   const volunteers = await findNearbyVolunteers(
//     tx,
//     { lat: request.lat, lng: request.lng, radiusKm: request.broadcastRadiusKm },
//     request.requesterId,
//   );

//   if (volunteers.length === 0) return { notified: [] as string[] };

//   const rows = await tx
//     .insert(requestBroadcasts)
//     .values(
//       volunteers.map((v) => ({
//         requestId: request.id,
//         volunteerId: v.volunteerId,
//         distanceKm: Number(v.distanceKm),
//       })),
//     )
//     .onConflictDoUpdate({
//       target: [requestBroadcasts.requestId, requestBroadcasts.volunteerId],
//       set: {
//         status: "sent",
//         distanceKm: sql`excluded.distance_km`,
//         notifiedAt: new Date(),
//       },
//       setWhere: sql`${requestBroadcasts.status} = 'expired' and ${requestBroadcasts.respondedAt} is null`,
//     })
//     .returning({ volunteerId: requestBroadcasts.volunteerId });

//   return { notified: rows.map((r) => r.volunteerId) };
// };

// // Request ko wapas "broadcasted" karo aur nearby volunteers ko dobara broadcast karo
// const reopenRequest = async (
//   tx: Tx,
//   request: BroadcastRequest & { expiresAt: Date | null },
// ) => {
//   if (request.expiresAt && request.expiresAt <= new Date()) {
//     await tx
//       .update(requests)
//       .set({ status: "expired" })
//       .where(eq(requests.id, request.id));
//     return { notified: [] as string[] };
//   }

//   await tx
//     .update(requests)
//     .set({ status: "broadcasted" })
//     .where(eq(requests.id, request.id));

//   return broadcastToNearby(tx, request);
// };

// export const declineRequest = withErrorHandling(
//   "Decline request",
//   async ({ requestId }: RequestIdParamInput, user: User) => {
//     return db.transaction(async (tx) => {
//       // 1. Lock
//       const [request] = await tx
//         .select({
//           id: requests.id,
//           requesterId: requests.requesterId,
//           status: requests.status,
//           expiresAt: requests.expiresAt,
//           lat: requests.lat,
//           lng: requests.lng,
//           broadcastRadiusKm: requests.broadcastRadiusKm,
//           totalVolunteersNeeded: requests.totalVolunteersNeeded,
//         })
//         .from(requests)
//         .where(eq(requests.id, requestId))
//         .for("update");

//       if (!request) throw ApiError.notFound("Request not found");

//       // 2. Broadcast hona zaroori
//       const [broadcast] = await tx
//         .select({ status: requestBroadcasts.status })
//         .from(requestBroadcasts)
//         .where(
//           and(
//             eq(requestBroadcasts.requestId, requestId),
//             eq(requestBroadcasts.volunteerId, user.id),
//           ),
//         );

//       if (!broadcast) {
//         throw ApiError.badRequest("This request was not sent to you");
//       }

//       // 3. Kya is volunteer ki active assignment hai? (accept karke ab reject)
//       const [assignment] = await tx
//         .select({ completedAt: requestAssignments.completedAt })
//         .from(requestAssignments)
//         .where(
//           and(
//             eq(requestAssignments.requestId, requestId),
//             eq(requestAssignments.volunteerId, user.id),
//             isNull(requestAssignments.cancelledAt),
//           ),
//         );

//       const now = new Date();

//       // ---- Case A: accept nahi kiya tha, simple decline ----
//       if (!assignment) {
//         if (!["sent", "seen"].includes(broadcast.status)) {
//           throw ApiError.badRequest(
//             `You cannot decline (status: ${broadcast.status})`,
//           );
//         }

//         await tx
//           .update(requestBroadcasts)
//           .set({ status: "declined", respondedAt: now })
//           .where(
//             and(
//               eq(requestBroadcasts.requestId, requestId),
//               eq(requestBroadcasts.volunteerId, user.id),
//             ),
//           );

//         return {
//           requestId,
//           action: "declined" as const,
//           reopened: false,
//           completed: false,
//           notified: [] as string[],
//         };
//       }

//       // ---- Case B: accept kiya tha, ab cancel ----
//       if (assignment.completedAt) {
//         throw ApiError.badRequest("Completed request cannot be cancelled");
//       }

//       await tx
//         .update(requestAssignments)
//         .set({ cancelledAt: now })
//         .where(
//           and(
//             eq(requestAssignments.requestId, requestId),
//             eq(requestAssignments.volunteerId, user.id),
//           ),
//         );

//       await tx
//         .update(requestBroadcasts)
//         .set({ status: "declined", respondedAt: now })
//         .where(
//           and(
//             eq(requestBroadcasts.requestId, requestId),
//             eq(requestBroadcasts.volunteerId, user.id),
//           ),
//         );

//       // Active / done assignments gino (cancel update ho chuka hai)
//       const [activeRow] = await tx
//         .select({ active: count() })
//         .from(requestAssignments)
//         .where(
//           and(
//             eq(requestAssignments.requestId, requestId),
//             isNull(requestAssignments.completedAt),
//             isNull(requestAssignments.cancelledAt),
//           ),
//         );
//       const active = activeRow?.active ?? 0;

//       const [doneRow] = await tx
//         .select({ done: count() })
//         .from(requestAssignments)
//         .where(
//           and(
//             eq(requestAssignments.requestId, requestId),
//             isNotNull(requestAssignments.completedAt),
//           ),
//         );
//       const done = doneRow?.done ?? 0;

//       let reopened = false;
//       let completed = false;
//       let notified: string[] = [];

//       if (request.status === "in_progress" && active === 0) {
//         if (done > 0) {
//           // kisi ne kaam poora kiya tha -> request completed
//           await tx
//             .update(requests)
//             .set({ status: "completed" })
//             .where(eq(requests.id, requestId));

//           // pending broadcasts expire
//           await tx
//             .update(requestBroadcasts)
//             .set({ status: "expired" })
//             .where(
//               and(
//                 eq(requestBroadcasts.requestId, requestId),
//                 inArray(requestBroadcasts.status, ["sent", "seen"]),
//               ),
//             );
//           completed = true;
//         } else {
//           // kisi ne kaam poora nahi kiya -> wapas open + dobara broadcast
//           const result = await reopenRequest(tx, request);
//           notified = result.notified;
//           reopened = true;
//         }
//       } else if (
//         request.status === "accepted" &&
//         active + done < request.totalVolunteersNeeded
//       ) {
//         // accepted (full) tha, slot khali hua -> wapas open
//         const result = await reopenRequest(tx, request);
//         notified = result.notified;
//         reopened = true;
//       }

//       return {
//         requestId,
//         action: "cancelled" as const,
//         reopened,
//         completed,
//         notified,
//       };
//     });
//   },
// );

// export const completeRequest = withErrorHandling(
//   "Complete request",
//   async ({ requestId }: RequestIdParamInput, user: User) => {
//     return db.transaction(async (tx) => {
//       // 1. Lock
//       const [request] = await tx
//         .select({
//           id: requests.id,
//           requesterId: requests.requesterId,
//           status: requests.status,
//         })
//         .from(requests)
//         .where(eq(requests.id, requestId))
//         .for("update");

//       if (!request) throw ApiError.notFound("Request not found");

//       if (request.status !== "in_progress") {
//         throw ApiError.badRequest(
//           request.status === "completed"
//             ? "Request is already completed"
//             : "Request must be in progress to complete",
//         );
//       }

//       // 2. Is volunteer ki active assignment honi chahiye
//       const [assignment] = await tx
//         .select({ inProgressAt: requestAssignments.inProgressAt })
//         .from(requestAssignments)
//         .where(
//           and(
//             eq(requestAssignments.requestId, requestId),
//             eq(requestAssignments.volunteerId, user.id),
//             isNull(requestAssignments.completedAt),
//             isNull(requestAssignments.cancelledAt),
//           ),
//         );

//       if (!assignment) {
//         throw ApiError.badRequest(
//           "You have no active assignment on this request",
//         );
//       }

//       const now = new Date();

//       // 3. Is volunteer ki assignment complete
//       await tx
//         .update(requestAssignments)
//         .set({ completedAt: now })
//         .where(
//           and(
//             eq(requestAssignments.requestId, requestId),
//             eq(requestAssignments.volunteerId, user.id),
//           ),
//         );

//       // 4. Aur koi volunteer abhi kaam kar raha hai?
//       const [remainingRow] = await tx
//         .select({ remaining: count() })
//         .from(requestAssignments)
//         .where(
//           and(
//             eq(requestAssignments.requestId, requestId),
//             isNull(requestAssignments.completedAt),
//             isNull(requestAssignments.cancelledAt),
//           ),
//         );

//       const remaining = remainingRow?.remaining ?? 0;

//       if (remaining > 0) {
//         return {
//           requestId,
//           requestCompleted: false,
//           remainingVolunteers: remaining,
//           expiredVolunteerIds: [] as string[],
//         };
//       }

//       // 5. Sab ho gaya: request completed + pending broadcasts expire
//       await tx
//         .update(requests)
//         .set({ status: "completed" })
//         .where(eq(requests.id, requestId));

//       const expired = await tx
//         .update(requestBroadcasts)
//         .set({ status: "expired" })
//         .where(
//           and(
//             eq(requestBroadcasts.requestId, requestId),
//             inArray(requestBroadcasts.status, ["sent", "seen"]),
//           ),
//         )
//         .returning({ volunteerId: requestBroadcasts.volunteerId });

//       return {
//         requestId,
//         requestCompleted: true,
//         remainingVolunteers: 0,
//         expiredVolunteerIds: expired.map((r) => r.volunteerId),
//       };
//     });
//   },
// );

// export const cancelRequest = withErrorHandling(
//   "Cancel request",
//   async ({ requestId }: RequestIdParamInput, user: User) => {
//     return db.transaction(async (tx) => {
//       const [request] = await tx
//         .select({
//           id: requests.id,
//           requesterId: requests.requesterId,
//           status: requests.status,
//         })
//         .from(requests)
//         .where(eq(requests.id, requestId))
//         .for("update");

//       if (!request) throw ApiError.notFound("Request not found");

//       if (request.requesterId !== user.id) {
//         throw ApiError.badRequest("Only the requester can cancel this request");
//       }

//       if (["completed", "cancelled", "expired"].includes(request.status)) {
//         throw ApiError.badRequest(`Request is already ${request.status}`);
//       }

//       const now = new Date();

//       await tx
//         .update(requests)
//         .set({ status: "cancelled" })
//         .where(eq(requests.id, requestId));

//       // Active volunteers ko free karo, aur jinhe notify karna hai unki list lo
//       const released = await tx
//         .update(requestAssignments)
//         .set({ cancelledAt: now })
//         .where(
//           and(
//             eq(requestAssignments.requestId, requestId),
//             isNull(requestAssignments.completedAt),
//             isNull(requestAssignments.cancelledAt),
//           ),
//         )
//         .returning({ volunteerId: requestAssignments.volunteerId });

//       // Pending broadcasts expire
//       const expired = await tx
//         .update(requestBroadcasts)
//         .set({ status: "expired" })
//         .where(
//           and(
//             eq(requestBroadcasts.requestId, requestId),
//             inArray(requestBroadcasts.status, ["sent", "seen"]),
//           ),
//         )
//         .returning({ volunteerId: requestBroadcasts.volunteerId });

//       return {
//         requestId,
//         status: "cancelled" as const,
//         releasedVolunteerIds: released.map((r) => r.volunteerId),
//         expiredVolunteerIds: expired.map((r) => r.volunteerId),
//       };
//     });
//   },
// );

import {
  eq,
  ne,
  and,
  isNull,
  inArray,
  notInArray,
  isNotNull,
  lte,
} from "drizzle-orm/sql/expressions/conditions";
import { db } from "../../../db/index.js";
import {
  requestAssignments,
  requestBroadcasts,
  chatMessages,
  chatParticipants,
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
import { desc } from "drizzle-orm/sql/expressions/select";
import { sql } from "drizzle-orm/sql/sql";
import { count } from "drizzle-orm/sql/functions/aggregate";
import type { RequestIdParamInput } from "./dto/requestIdParam.dto.js";
import type { AcceptRequestBodyInput } from "./dto/acceptRequest.dto.js";
import { closeRequestChat, joinUserToRequestChat } from "../../socket/chat-room.js";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// ============================================================
// Helpers
// ============================================================

// Do points ke beech seedhi doori (km), SQL wale formula jaisi
const distanceBetweenKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
};

// ---------- 1. Nearby volunteers (latest location, sirf role = volunteer) ----------
const findNearbyVolunteers = async (
  tx: Tx,
  point: { lat: number; lng: number; radiusKm: number },
  excludeUserId?: string,
) => {
  const latestLocation = tx
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
      cos(radians(${point.lat})) * cos(radians(${latestLocation.lat}))
      * cos(radians(${latestLocation.lng}) - radians(${point.lng}))
      + sin(radians(${point.lat})) * sin(radians(${latestLocation.lat}))
    )))
  `;

  const conditions = [
    sql`${distanceKm} <= ${point.radiusKm}`,
    eq(users.isBanned, false), // banned volunteers ko alert nahi
    // jo volunteer pehle se kisi active request me hai (accepted / in_progress) use alert nahi
    sql`not exists (
      select 1 from ${requestAssignments}
      where ${requestAssignments.volunteerId} = ${users.id}
        and ${requestAssignments.completedAt} is null
        and ${requestAssignments.cancelledAt} is null
    )`,
  ];
  if (excludeUserId) {
    conditions.push(ne(users.id, excludeUserId));
  }

  return tx
    .select({
      volunteerId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      lat: latestLocation.lat,
      lng: latestLocation.lng,
      recordedAt: latestLocation.recordedAt,
      distanceKm,
    })
    .from(latestLocation)
    .innerJoin(users, eq(users.id, latestLocation.userId))
    .where(and(...conditions))
    .orderBy(distanceKm);
};

type BroadcastRequest = {
  id: string;
  lat: number;
  lng: number;
  broadcastRadiusKm: number;
  requesterId: string;
};

// Nearby volunteers dhundho aur request_broadcasts me upsert karo.
// Naye volunteers insert hote hain, "expired + bina response" wale wapas "sent" hote hain.
// declined / accepted / sent / seen rows touch nahi hoti.
const broadcastToNearby = async (tx: Tx, request: BroadcastRequest) => {
  const volunteers = await findNearbyVolunteers(
    tx,
    { lat: request.lat, lng: request.lng, radiusKm: request.broadcastRadiusKm },
    request.requesterId,
  );

  if (volunteers.length === 0) return { notified: [] as string[] };

  const rows = await tx
    .insert(requestBroadcasts)
    .values(
      volunteers.map((v) => ({
        requestId: request.id,
        volunteerId: v.volunteerId,
        distanceKm: Number(v.distanceKm),
      })),
    )
    .onConflictDoUpdate({
      target: [requestBroadcasts.requestId, requestBroadcasts.volunteerId],
      set: {
        status: "sent",
        distanceKm: sql`excluded.distance_km`,
        notifiedAt: new Date(),
      },
      setWhere: sql`${requestBroadcasts.status} = 'expired' and ${requestBroadcasts.respondedAt} is null`,
    })
    .returning({ volunteerId: requestBroadcasts.volunteerId });

  return { notified: rows.map((r) => r.volunteerId) };
};

// Request ko wapas "broadcasted" karo aur nearby volunteers ko dobara broadcast karo
const reopenRequest = async (
  tx: Tx,
  request: BroadcastRequest & { expiresAt: Date | null },
) => {
  if (request.expiresAt && request.expiresAt <= new Date()) {
    await tx
      .update(requests)
      .set({ status: "expired" })
      .where(eq(requests.id, request.id));

    // pending broadcasts bhi expire, taaki volunteers ki list me na dikhe
    await tx
      .update(requestBroadcasts)
      .set({ status: "expired" })
      .where(
        and(
          eq(requestBroadcasts.requestId, request.id),
          inArray(requestBroadcasts.status, ["sent", "seen"]),
        ),
      );

    return { notified: [] as string[], expired: true };
  }

  await tx
    .update(requests)
    .set({ status: "broadcasted" })
    .where(eq(requests.id, request.id));

  return { ...(await broadcastToNearby(tx, request)), expired: false };
};

const countTakenSlots = async (tx: Tx, requestId: string): Promise<number> => {
  const [row] = await tx
    .select({ taken: count() })
    .from(requestAssignments)
    .where(
      and(
        eq(requestAssignments.requestId, requestId),
        isNull(requestAssignments.cancelledAt),
      ),
    );

  return row?.taken ?? 0;
};

const ensureActiveChatParticipant = async (
  tx: Tx,
  requestId: string,
  requesterId: string,
  userId: string,
) => {
  if (requesterId !== userId) {
    const [assignment] = await tx
      .select({ volunteerId: requestAssignments.volunteerId })
      .from(requestAssignments)
      .where(
        and(
          eq(requestAssignments.requestId, requestId),
          eq(requestAssignments.volunteerId, userId),
          isNull(requestAssignments.cancelledAt),
        ),
      )
      .limit(1);

    if (!assignment) {
      throw ApiError.forbidden("Only the requester and accepted volunteers can join this chat");
    }
  }

  await tx
    .insert(chatParticipants)
    .values({ requestId, userId })
    .onConflictDoNothing();

  const [participant] = await tx
    .select({ leftAt: chatParticipants.leftAt })
    .from(chatParticipants)
    .where(
      and(
        eq(chatParticipants.requestId, requestId),
        eq(chatParticipants.userId, userId),
      ),
    )
    .limit(1);

  if (!participant || participant.leftAt) {
    throw ApiError.forbidden("You have left this chat and cannot rejoin");
  }
};

export const chatRoomsForUser = withErrorHandling(
  "Get active chat rooms for user",
  async (userId: string) => {
    const participants = await db
      .select({ requestId: chatParticipants.requestId })
      .from(chatParticipants)
      .innerJoin(requests, eq(requests.id, chatParticipants.requestId))
      .where(
        and(
          eq(chatParticipants.userId, userId),
          isNull(chatParticipants.leftAt),
          notInArray(requests.status, ["completed", "cancelled", "expired"]),
        ),
      );

    return participants.map((participant) => participant.requestId);
  },
);

export const joinChatRoom = withErrorHandling(
  "Join request chat",
  async ({ requestId }: RequestIdParamInput, user: User) => {
    await db.transaction(async (tx) => {
      const [request] = await tx
        .select({ requesterId: requests.requesterId, status: requests.status })
        .from(requests)
        .where(eq(requests.id, requestId))
        .limit(1);

      if (!request) throw ApiError.notFound("Request not found");
      if (["completed", "cancelled", "expired"].includes(request.status)) {
        throw ApiError.badRequest("This request chat is closed");
      }

      await ensureActiveChatParticipant(tx, requestId, request.requesterId, user.id);
    });

    return { requestId };
  },
);

export const leaveChatRoom = withErrorHandling(
  "Leave request chat",
  async ({ requestId }: RequestIdParamInput, user: User) => {
    return db.transaction(async (tx) => {
      const [request] = await tx
        .select({ requesterId: requests.requesterId })
        .from(requests)
        .where(eq(requests.id, requestId))
        .limit(1);

      if (!request) throw ApiError.notFound("Request not found");
      if (request.requesterId === user.id) {
        return { requestId, permanent: false };
      }

      const [participant] = await tx
        .select({ leftAt: chatParticipants.leftAt })
        .from(chatParticipants)
        .where(
          and(
            eq(chatParticipants.requestId, requestId),
            eq(chatParticipants.userId, user.id),
          ),
        )
        .limit(1);

      if (!participant || participant.leftAt) {
        throw ApiError.forbidden("You are not an active participant in this chat");
      }

      const [assignment] = await tx
        .select({ volunteerId: requestAssignments.volunteerId })
        .from(requestAssignments)
        .where(
          and(
            eq(requestAssignments.requestId, requestId),
            eq(requestAssignments.volunteerId, user.id),
            isNull(requestAssignments.cancelledAt),
          ),
        )
        .limit(1);

      if (!assignment) {
        throw ApiError.forbidden("Only accepted volunteers can leave this chat");
      }

      await tx
        .update(chatParticipants)
        .set({ leftAt: new Date() })
        .where(
          and(
            eq(chatParticipants.requestId, requestId),
            eq(chatParticipants.userId, user.id),
            isNull(chatParticipants.leftAt),
          ),
        );

      return { requestId, permanent: true };
    });
  },
);

export const sendChatMessage = withErrorHandling(
  "Send request chat message",
  async (
    { requestId }: RequestIdParamInput,
    user: User,
    body: unknown,
  ) => {
    if (typeof body !== "string" || !body.trim() || body.trim().length > 4000) {
      throw ApiError.badRequest("Message must contain 1 to 4000 characters");
    }

    return db.transaction(async (tx) => {
      const [request] = await tx
        .select({ requesterId: requests.requesterId, status: requests.status })
        .from(requests)
        .where(eq(requests.id, requestId))
        .limit(1);

      if (!request) throw ApiError.notFound("Request not found");
      if (["completed", "cancelled", "expired"].includes(request.status)) {
        throw ApiError.badRequest("This request chat is closed");
      }

      await ensureActiveChatParticipant(tx, requestId, request.requesterId, user.id);

      const [message] = await tx
        .insert(chatMessages)
        .values({ requestId, senderId: user.id, body: body.trim() })
        .returning({
          id: chatMessages.id,
          requestId: chatMessages.requestId,
          senderId: chatMessages.senderId,
          body: chatMessages.body,
          createdAt: chatMessages.createdAt,
        });

      if (!message) throw ApiError.internal("Failed to save chat message");
      return message;
    });
  },
);

// ============================================================
// APIs
// ============================================================

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

    const newRequest = await (async () => {
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

          await tx.insert(chatParticipants).values({
            requestId: newRequest.id,
            userId: id,
          });

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
    })();

    await joinUserToRequestChat(id, newRequest.id);
    return newRequest;
  },
);

// ---------- 2. Find + broadcast (pehli baar bhi, decline ke baad bhi) ----------
// ---------- 2. Find + broadcast (pehli baar bhi, decline ke baad bhi) ----------
export const volunteersForRequest = withErrorHandling(
  "Find Volunteers for request",
  async ({ requestId }: RequestIdParamInput, user: User) => {
    return db.transaction(async (tx) => {
      // Lock: accept/decline ke saath race na ho
      const [request] = await tx
        .select({
          id: requests.id,
          requesterId: requests.requesterId,
          status: requests.status,
          expiresAt: requests.expiresAt,
          lat: requests.lat,
          lng: requests.lng,
          address: requests.address,
          broadcastRadiusKm: requests.broadcastRadiusKm,
        })
        .from(requests)
        .where(eq(requests.id, requestId))
        .limit(1)
        .for("update");

      if (!request) throw ApiError.notFound("Request not found");

      // Sirf request raise karne wala hi broadcast trigger kare
      if (request.requesterId !== user.id) {
        throw ApiError.badRequest("This is not your request");
      }

      // accepted / in_progress me naye volunteers ki zaroorat nahi
      if (request.status !== "broadcasted") {
        throw ApiError.badRequest(
          `Request is ${request.status}, volunteers cannot be searched now`,
        );
      }

      if (request.expiresAt && request.expiresAt <= new Date()) {
        throw ApiError.badRequest("Request has expired");
      }

      // Latest location se ABHI ke nearby volunteers (requester excluded)
      const nearby = await findNearbyVolunteers(
        tx,
        {
          lat: request.lat,
          lng: request.lng,
          radiusKm: request.broadcastRadiusKm,
        },
        request.requesterId,
      );

      const nearbyIds = nearby.map((v) => v.volunteerId);

      // A. sent/seen the par ab radius ke bahar hain -> expired
      const expireConditions = [
        eq(requestBroadcasts.requestId, request.id),
        inArray(requestBroadcasts.status, ["sent", "seen"]),
      ];
      if (nearbyIds.length > 0) {
        expireConditions.push(
          notInArray(requestBroadcasts.volunteerId, nearbyIds),
        );
      }

      await tx
        .update(requestBroadcasts)
        .set({ status: "expired" })
        .where(and(...expireConditions));

      // declined volunteers ko response list se hatao
      const declinedRows = await tx
        .select({ volunteerId: requestBroadcasts.volunteerId })
        .from(requestBroadcasts)
        .where(
          and(
            eq(requestBroadcasts.requestId, request.id),
            eq(requestBroadcasts.status, "declined"),
          ),
        );
      const declinedIds = new Set(declinedRows.map((r) => r.volunteerId));

      const volunteers = nearby
        .filter((v) => !declinedIds.has(v.volunteerId))
        .map((v) => ({
          ...v,
          distanceKm: Number(Number(v.distanceKm).toFixed(2)),
        }));

      if (nearbyIds.length === 0) {
        return {
          request,
          volunteers,
          notifiedVolunteerIds: [] as string[],
          notifiedCount: 0,
        };
      }

      // B. Naye volunteers insert, "expired + bina response" wale wapas "sent".
      //    declined / accepted / sent / seen rows touch nahi hoti.
      const notified = await tx
        .insert(requestBroadcasts)
        .values(
          nearby.map((v) => ({
            requestId: request.id,
            volunteerId: v.volunteerId,
            distanceKm: Number(v.distanceKm),
          })),
        )
        .onConflictDoUpdate({
          target: [requestBroadcasts.requestId, requestBroadcasts.volunteerId],
          set: {
            status: "sent",
            distanceKm: sql`excluded.distance_km`,
            notifiedAt: new Date(),
          },
          setWhere: sql`${requestBroadcasts.status} = 'expired' and ${requestBroadcasts.respondedAt} is null`,
        })
        .returning({ volunteerId: requestBroadcasts.volunteerId });

      const notifiedVolunteerIds = notified.map((r) => r.volunteerId);

      return {
        request,
        volunteers, // radius ke andar, declined ko chhodkar
        notifiedVolunteerIds, // sirf inhe push bhejo
        notifiedCount: notifiedVolunteerIds.length,
      };
    });
  },
);

export const acceptRequest = withErrorHandling(
  "Accept request",
  async ({ requestId, lat, lng }: AcceptRequestBodyInput, user: User) => {
    const result = await db.transaction(async (tx) => {
      // 1. Request row lock: is request par accept/decline ek-ek karke chalenge
      const [request] = await tx
        .select({
          id: requests.id,
          requesterId: requests.requesterId,
          status: requests.status,
          expiresAt: requests.expiresAt,
          lat: requests.lat,
          lng: requests.lng,
          broadcastRadiusKm: requests.broadcastRadiusKm,
          totalVolunteersNeeded: requests.totalVolunteersNeeded,
        })
        .from(requests)
        .where(eq(requests.id, requestId))
        .for("update");

      if (!request) throw ApiError.notFound("Request not found");

      if (request.requesterId === user.id) {
        throw ApiError.badRequest("You cannot accept your own request");
      }
      if (request.status !== "broadcasted") {
        throw ApiError.badRequest(
          request.status === "accepted"
            ? "This request already has enough volunteers"
            : `Request is ${request.status}`,
        );
      }
      if (request.expiresAt && request.expiresAt < new Date()) {
        throw ApiError.badRequest("Request has expired");
      }

      // 2. Volunteer profile row na ho to bana do (default isAvailable = true)
      await tx
        .insert(volunteerProfiles)
        .values({ userId: user.id })
        .onConflictDoNothing();

      const [profile] = await tx
        .select({ isAvailable: volunteerProfiles.isAvailable })
        .from(volunteerProfiles)
        .where(eq(volunteerProfiles.userId, user.id));

      if (!profile?.isAvailable) {
        throw ApiError.badRequest("Turn on availability to accept requests");
      }

      // 3. Is volunteer ko broadcast mila hona chahiye aur abhi pending ho
      const [broadcast] = await tx
        .select({ status: requestBroadcasts.status })
        .from(requestBroadcasts)
        .where(
          and(
            eq(requestBroadcasts.requestId, requestId),
            eq(requestBroadcasts.volunteerId, user.id),
          ),
        );

      if (!broadcast) {
        throw ApiError.badRequest("This request was not sent to you");
      }
      if (!["sent", "seen"].includes(broadcast.status)) {
        throw ApiError.badRequest(
          `You cannot accept (status: ${broadcast.status})`,
        );
      }

      // 3.1 Volunteer ABHI bhi radius ke andar hona chahiye (latest location se)
      // const [location] = await tx
      //   .select({ lat: userLocations.lat, lng: userLocations.lng })
      //   .from(userLocations)
      //   .where(eq(userLocations.userId, user.id))
      //   .orderBy(desc(userLocations.recordedAt))
      //   .limit(1);

      // if (!location) {
      //   throw ApiError.badRequest("Your location is not available");
      // }

      await tx
        .insert(userLocations)
        .values({
          userId: user.id,
          lat,
          lng,
          recordedAt: new Date(),
        })
        .onConflictDoNothing({
          target: [userLocations.userId, userLocations.recordedAt],
        });

      const currentDistanceKm = distanceBetweenKm(
        request.lat,
        request.lng,
        lat,
        lng,
      );
      if (currentDistanceKm > request.broadcastRadiusKm) {
        throw ApiError.badRequest("You are too far from this request");
      }

      // 4. Volunteer ki koi aur active request to nahi (accepted / in_progress)
      const [active] = await tx
        .select({ requestId: requestAssignments.requestId })
        .from(requestAssignments)
        .where(
          and(
            eq(requestAssignments.volunteerId, user.id),
            isNull(requestAssignments.completedAt),
            isNull(requestAssignments.cancelledAt),
          ),
        )
        .limit(1);

      if (active) {
        throw ApiError.badRequest("You already have an active request");
      }

      // 5. Slot khali hai ya nahi
      const taken = await countTakenSlots(tx, requestId);
      if (taken >= request.totalVolunteersNeeded) {
        throw ApiError.badRequest("This request already has enough volunteers");
      }

      // 6. Assignment + broadcast status
      try {
        await tx.insert(requestAssignments).values({
          requestId,
          volunteerId: user.id,
        });
      } catch (e: any) {
        // do requests ek saath accept hui to partial unique index error deta hai
        if (e?.code === "23505" || e?.cause?.code === "23505") {
          throw ApiError.badRequest("You already have an active request");
        }
        throw e;
      }

      await tx.insert(chatParticipants).values({
        requestId,
        userId: user.id,
      });

      await tx
        .update(requestBroadcasts)
        .set({ status: "accepted", respondedAt: new Date() })
        .where(
          and(
            eq(requestBroadcasts.requestId, requestId),
            eq(requestBroadcasts.volunteerId, user.id),
          ),
        );

      // 7. Sab slots bhar gaye to request "accepted", baaki broadcasts "expired"
      const nowTaken = taken + 1;
      const isFull = nowTaken >= request.totalVolunteersNeeded;

      if (isFull) {
        await tx
          .update(requests)
          .set({ status: "accepted" })
          .where(eq(requests.id, requestId));

        await tx
          .update(requestBroadcasts)
          .set({ status: "expired" })
          .where(
            and(
              eq(requestBroadcasts.requestId, requestId),
              inArray(requestBroadcasts.status, ["sent", "seen"]),
            ),
          );
      }

      return {
        requestId,
        accepted: nowTaken,
        needed: request.totalVolunteersNeeded,
        isFull,
      };
    });

    await joinUserToRequestChat(user.id, requestId);
    return result;
  },
);

export const proceedWithAccepted = withErrorHandling(
  "Proceed with accepted volunteers",
  async ({ requestId }: RequestIdParamInput, user: User) => {
    return db.transaction(async (tx) => {
      // 1. Lock
      const [request] = await tx
        .select({
          id: requests.id,
          requesterId: requests.requesterId,
          status: requests.status,
        })
        .from(requests)
        .where(eq(requests.id, requestId))
        .for("update");

      if (!request) throw ApiError.notFound("Request not found");

      if (request.requesterId !== user.id) {
        throw ApiError.badRequest("This is not your request");
      }

      if (request.status !== "broadcasted") {
        throw ApiError.badRequest(
          request.status === "accepted"
            ? "All volunteers are already confirmed"
            : `Request is ${request.status}`,
        );
      }

      // 2. Kam se kam 1 volunteer accept kar chuka ho
      const taken = await countTakenSlots(tx, requestId);
      if (taken === 0) {
        throw ApiError.badRequest("No volunteer has accepted yet");
      }

      // 3. Jitne mile utne hi final: request accepted
      await tx
        .update(requests)
        .set({ status: "accepted", totalVolunteersNeeded: taken })
        .where(eq(requests.id, requestId));

      // 4. Pending broadcasts expire (naye volunteers nahi chahiye)
      const expired = await tx
        .update(requestBroadcasts)
        .set({ status: "expired" })
        .where(
          and(
            eq(requestBroadcasts.requestId, requestId),
            inArray(requestBroadcasts.status, ["sent", "seen"]),
          ),
        )
        .returning({ volunteerId: requestBroadcasts.volunteerId });

      return {
        requestId,
        volunteersConfirmed: taken,
        expiredVolunteerIds: expired.map((r) => r.volunteerId),
      };
    });
  },
);

export const startRequest = withErrorHandling(
  "Start request",
  async ({ requestId }: RequestIdParamInput, user: User) => {
    return db.transaction(async (tx) => {
      // 1. Lock
      const [request] = await tx
        .select({
          id: requests.id,
          status: requests.status,
          expiresAt: requests.expiresAt,
        })
        .from(requests)
        .where(eq(requests.id, requestId))
        .for("update");

      if (!request) throw ApiError.notFound("Request not found");

      // Sab slots bharne se pehle start nahi
      if (request.status === "broadcasted") {
        throw ApiError.badRequest(
          "Waiting for all volunteers to accept. You can start once all slots are filled",
        );
      }

      if (!["accepted", "in_progress"].includes(request.status)) {
        throw ApiError.badRequest(`Request is ${request.status}`);
      }

      // 2. Is volunteer ki active assignment honi chahiye
      const [assignment] = await tx
        .select({ inProgressAt: requestAssignments.inProgressAt })
        .from(requestAssignments)
        .where(
          and(
            eq(requestAssignments.requestId, requestId),
            eq(requestAssignments.volunteerId, user.id),
            isNull(requestAssignments.completedAt),
            isNull(requestAssignments.cancelledAt),
          ),
        );

      if (!assignment) {
        throw ApiError.badRequest("You have not accepted this request");
      }
      if (assignment.inProgressAt) {
        throw ApiError.badRequest("You have already started this request");
      }

      const now = new Date();

      // 3. Is volunteer ki assignment in_progress
      await tx
        .update(requestAssignments)
        .set({ inProgressAt: now })
        .where(
          and(
            eq(requestAssignments.requestId, requestId),
            eq(requestAssignments.volunteerId, user.id),
          ),
        );

      // 4. Pehla volunteer start kare to request in_progress
      let requestStarted = false;

      if (request.status === "accepted") {
        await tx
          .update(requests)
          .set({ status: "in_progress" })
          .where(eq(requests.id, requestId));
        requestStarted = true;
      }
      return { requestId, startedAt: now, requestStarted };
    });
  },
);

export const declineRequest = withErrorHandling(
  "Decline request",
  async ({ requestId }: RequestIdParamInput, user: User) => {
    let closeChat = false;
    const result = await db.transaction(async (tx) => {
      // 1. Lock
      const [request] = await tx
        .select({
          id: requests.id,
          requesterId: requests.requesterId,
          status: requests.status,
          expiresAt: requests.expiresAt,
          lat: requests.lat,
          lng: requests.lng,
          broadcastRadiusKm: requests.broadcastRadiusKm,
          totalVolunteersNeeded: requests.totalVolunteersNeeded,
        })
        .from(requests)
        .where(eq(requests.id, requestId))
        .for("update");

      if (!request) throw ApiError.notFound("Request not found");

      // 2. Broadcast hona zaroori
      const [broadcast] = await tx
        .select({ status: requestBroadcasts.status })
        .from(requestBroadcasts)
        .where(
          and(
            eq(requestBroadcasts.requestId, requestId),
            eq(requestBroadcasts.volunteerId, user.id),
          ),
        );

      if (!broadcast) {
        throw ApiError.badRequest("This request was not sent to you");
      }

      // 3. Kya is volunteer ki active assignment hai? (accept karke ab reject)
      const [assignment] = await tx
        .select({ completedAt: requestAssignments.completedAt })
        .from(requestAssignments)
        .where(
          and(
            eq(requestAssignments.requestId, requestId),
            eq(requestAssignments.volunteerId, user.id),
            isNull(requestAssignments.cancelledAt),
          ),
        );

      const now = new Date();

      // ---- Case A: accept nahi kiya tha, simple decline ----
      if (!assignment) {
        if (!["sent", "seen"].includes(broadcast.status)) {
          throw ApiError.badRequest(
            `You cannot decline (status: ${broadcast.status})`,
          );
        }

        await tx
          .update(requestBroadcasts)
          .set({ status: "declined", respondedAt: now })
          .where(
            and(
              eq(requestBroadcasts.requestId, requestId),
              eq(requestBroadcasts.volunteerId, user.id),
            ),
          );

        return {
          requestId,
          action: "declined" as const,
          reopened: false,
          completed: false,
          notified: [] as string[],
        };
      }

      // ---- Case B: accept kiya tha, ab cancel ----
      if (assignment.completedAt) {
        throw ApiError.badRequest("Completed request cannot be cancelled");
      }

      await tx
        .update(requestAssignments)
        .set({ cancelledAt: now })
        .where(
          and(
            eq(requestAssignments.requestId, requestId),
            eq(requestAssignments.volunteerId, user.id),
          ),
        );

      await tx
        .update(chatParticipants)
        .set({ leftAt: now })
        .where(
          and(
            eq(chatParticipants.requestId, requestId),
            eq(chatParticipants.userId, user.id),
            isNull(chatParticipants.leftAt),
          ),
        );

      await tx
        .update(requestBroadcasts)
        .set({ status: "declined", respondedAt: now })
        .where(
          and(
            eq(requestBroadcasts.requestId, requestId),
            eq(requestBroadcasts.volunteerId, user.id),
          ),
        );

      // Active / done assignments gino (cancel update ho chuka hai)
      const [activeRow] = await tx
        .select({ active: count() })
        .from(requestAssignments)
        .where(
          and(
            eq(requestAssignments.requestId, requestId),
            isNull(requestAssignments.completedAt),
            isNull(requestAssignments.cancelledAt),
          ),
        );
      const active = activeRow?.active ?? 0;

      const [doneRow] = await tx
        .select({ done: count() })
        .from(requestAssignments)
        .where(
          and(
            eq(requestAssignments.requestId, requestId),
            isNotNull(requestAssignments.completedAt),
          ),
        );
      const done = doneRow?.done ?? 0;

      let reopened = false;
      let completed = false;
      let notified: string[] = [];

      if (request.status === "in_progress" && active === 0) {
        if (done > 0) {
          // kisi ne kaam poora kiya tha -> request completed
          await tx
            .update(requests)
            .set({ status: "completed" })
            .where(eq(requests.id, requestId));
          closeChat = true;

          // pending broadcasts expire
          await tx
            .update(requestBroadcasts)
            .set({ status: "expired" })
            .where(
              and(
                eq(requestBroadcasts.requestId, requestId),
                inArray(requestBroadcasts.status, ["sent", "seen"]),
              ),
            );
          completed = true;
        } else {
          // kisi ne kaam poora nahi kiya -> wapas open + dobara broadcast
          const result = await reopenRequest(tx, request);
          notified = result.notified;
          reopened = true;
          closeChat = result.expired;
        }
      } else if (
        request.status === "accepted" &&
        active + done < request.totalVolunteersNeeded
      ) {
        // accepted (full) tha, slot khali hua -> wapas open
        const result = await reopenRequest(tx, request);
        notified = result.notified;
        reopened = true;
        closeChat = result.expired;
      }

      return {
        requestId,
        action: "cancelled" as const,
        reopened,
        completed,
        notified,
      };
    });

    if (closeChat) await closeRequestChat(requestId);
    return result;
  },
);

export const completeRequest = withErrorHandling(
  "Complete request",
  async ({ requestId }: RequestIdParamInput, user: User) => {
    const result = await db.transaction(async (tx) => {
      // 1. Lock
      const [request] = await tx
        .select({
          id: requests.id,
          requesterId: requests.requesterId,
          status: requests.status,
        })
        .from(requests)
        .where(eq(requests.id, requestId))
        .for("update");

      if (!request) throw ApiError.notFound("Request not found");

      // accepted par bhi complete allow (volunteer ne start nahi dabaya par kaam kar diya)
      if (!["accepted", "in_progress"].includes(request.status)) {
        throw ApiError.badRequest(
          request.status === "completed"
            ? "Request is already completed"
            : request.status === "broadcasted"
              ? "Waiting for all volunteers to accept"
              : `Request is ${request.status}`,
        );
      }

      // 2. Is volunteer ki active assignment honi chahiye
      const [assignment] = await tx
        .select({ inProgressAt: requestAssignments.inProgressAt })
        .from(requestAssignments)
        .where(
          and(
            eq(requestAssignments.requestId, requestId),
            eq(requestAssignments.volunteerId, user.id),
            isNull(requestAssignments.completedAt),
            isNull(requestAssignments.cancelledAt),
          ),
        );

      if (!assignment) {
        throw ApiError.badRequest(
          "You have no active assignment on this request",
        );
      }

      const now = new Date();

      // 3. Assignment complete (start nahi kiya tha to ab set)
      await tx
        .update(requestAssignments)
        .set({
          completedAt: now,
          inProgressAt: assignment.inProgressAt ?? now,
        })
        .where(
          and(
            eq(requestAssignments.requestId, requestId),
            eq(requestAssignments.volunteerId, user.id),
          ),
        );

      // 4. Aur koi volunteer abhi kaam kar raha hai?
      const [remainingRow] = await tx
        .select({ remaining: count() })
        .from(requestAssignments)
        .where(
          and(
            eq(requestAssignments.requestId, requestId),
            isNull(requestAssignments.completedAt),
            isNull(requestAssignments.cancelledAt),
          ),
        );

      const remaining = remainingRow?.remaining ?? 0;

      if (remaining > 0) {
        // request accepted thi to ab kaam shuru maano
        if (request.status === "accepted") {
          await tx
            .update(requests)
            .set({ status: "in_progress" })
            .where(eq(requests.id, requestId));
        }

        return {
          requestId,
          requestCompleted: false,
          remainingVolunteers: remaining,
          expiredVolunteerIds: [] as string[],
        };
      }

      // 5. Sab ho gaya: request completed + pending broadcasts expire
      await tx
        .update(requests)
        .set({ status: "completed" })
        .where(eq(requests.id, requestId));

      const expired = await tx
        .update(requestBroadcasts)
        .set({ status: "expired" })
        .where(
          and(
            eq(requestBroadcasts.requestId, requestId),
            inArray(requestBroadcasts.status, ["sent", "seen"]),
          ),
        )
        .returning({ volunteerId: requestBroadcasts.volunteerId });

      return {
        requestId,
        requestCompleted: true,
        remainingVolunteers: 0,
        expiredVolunteerIds: expired.map((r) => r.volunteerId),
      };
    });

    if (result.requestCompleted) await closeRequestChat(requestId);
    return result;
  },
);

export const cancelRequest = withErrorHandling(
  "Cancel request",
  async ({ requestId }: RequestIdParamInput, user: User) => {
    const result = await db.transaction(async (tx) => {
      const [request] = await tx
        .select({
          id: requests.id,
          requesterId: requests.requesterId,
          status: requests.status,
        })
        .from(requests)
        .where(eq(requests.id, requestId))
        .for("update");

      if (!request) throw ApiError.notFound("Request not found");

      if (request.requesterId !== user.id) {
        throw ApiError.badRequest("Only the requester can cancel this request");
      }

      if (["completed", "cancelled", "expired"].includes(request.status)) {
        throw ApiError.badRequest(`Request is already ${request.status}`);
      }

      const now = new Date();

      await tx
        .update(requests)
        .set({ status: "cancelled" })
        .where(eq(requests.id, requestId));

      // Active volunteers ko free karo, aur jinhe notify karna hai unki list lo
      const released = await tx
        .update(requestAssignments)
        .set({ cancelledAt: now })
        .where(
          and(
            eq(requestAssignments.requestId, requestId),
            isNull(requestAssignments.completedAt),
            isNull(requestAssignments.cancelledAt),
          ),
        )
        .returning({ volunteerId: requestAssignments.volunteerId });

      // Pending broadcasts expire
      const expired = await tx
        .update(requestBroadcasts)
        .set({ status: "expired" })
        .where(
          and(
            eq(requestBroadcasts.requestId, requestId),
            inArray(requestBroadcasts.status, ["sent", "seen"]),
          ),
        )
        .returning({ volunteerId: requestBroadcasts.volunteerId });

      return {
        requestId,
        status: "cancelled" as const,
        releasedVolunteerIds: released.map((r) => r.volunteerId),
        expiredVolunteerIds: expired.map((r) => r.volunteerId),
      };
    });

    await closeRequestChat(requestId);
    return result;
  },
);

// ---------- Cron: SLA nikli requests ko expire karo ----------
// Sirf "broadcasted" requests expire hoti hain (accepted / in_progress ko nahi chhedta)
export const expireOverdueRequests = withErrorHandling(
  "Expire overdue requests",
  async () => {
    const result = await db.transaction(async (tx) => {
      const now = new Date();

      const overdue = await tx
        .update(requests)
        .set({ status: "expired" })
        .where(
          and(
            eq(requests.status, "broadcasted"),
            isNotNull(requests.expiresAt),
            lte(requests.expiresAt, now),
          ),
        )
        .returning({ id: requests.id });

      const ids = overdue.map((r) => r.id);
      if (ids.length === 0) return { expiredRequestIds: [] as string[] };

      // Partial accept wale volunteers ko free karo (warna wo naye request accept nahi kar payenge)
      await tx
        .update(requestAssignments)
        .set({ cancelledAt: now })
        .where(
          and(
            inArray(requestAssignments.requestId, ids),
            isNull(requestAssignments.completedAt),
            isNull(requestAssignments.cancelledAt),
          ),
        );

      // Pending broadcasts expire
      await tx
        .update(requestBroadcasts)
        .set({ status: "expired" })
        .where(
          and(
            inArray(requestBroadcasts.requestId, ids),
            inArray(requestBroadcasts.status, ["sent", "seen"]),
          ),
        );

      return { expiredRequestIds: ids };
    });

    for (const requestId of result.expiredRequestIds) {
      await closeRequestChat(requestId);
    }
    return result;
  },
);
