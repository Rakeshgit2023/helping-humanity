import { db } from "../../../db/index.js";
import { requestPhotos, requests } from "../../../db/schema.js";
import { withErrorHandling } from "../../comman/middleware/withErrorHandling.js";
import ApiError from "../../comman/utils/api.error.js";
import type { User } from "../../comman/utils/jwt.js";
import {
  deleteFilesFromCloudinary,
  uploadFilesToCloudinary,
} from "../../comman/utils/uploadFilesToCloudinary.js";
import type { CreateRequestInput } from "./dto/createRequest.dto.js";

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
