import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";
import {
  bloodGroupValues,
  priorityValues,
} from "../../../comman/utils/constant.js";

const categorySchema = z.object(
  {
    id: z.uuid("Invalid category ID"),
    name: z
      .string("Category name is required")
      .min(1, "Category name is required"),
  },
  { error: "Category is required" },
);

const baseCreateRequestSchema = z.object({
  category: z.preprocess((value) => {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }

    return value;
  }, categorySchema),

  title: z
    .string({ error: "Title is required" })
    .min(5, "Title must be at least 5 characters")
    .max(160, "Title must not exceed 160 characters"),

  description: z
    .string()
    .max(250, "Description must not exceed 5000 characters")
    .optional(),

  lat: z.coerce
    .number({ error: "Latitude is required" })
    .min(-90, "Invalid latitude")
    .max(90, "Invalid latitude"),

  lng: z.coerce
    .number({ error: "Longitude is required" })
    .min(-180, "Invalid longitude")
    .max(180, "Invalid longitude"),

  address: z
    .string()
    .max(250, "Address must not exceed 1000 characters")
    .optional(),

  bloodGroupNeeded: z.enum(bloodGroupValues).optional(),

  hospitalName: z
    .string()
    .max(160, "Hospital name must not exceed 160 characters")
    .optional(),

  priority: z.enum(priorityValues).default("normal"),

  broadcastRadiusKm: z.coerce
    .number()
    .positive("Broadcast radius must be greater than 0")
    .max(10, "Broadcast radius must not exceed 10 km")
    .default(3),

  expiresAt: z.iso.datetime().optional(),
});
const createRequestSchema = baseCreateRequestSchema.superRefine((data, ctx) => {
  const isBloodDonation = data.category.name === "blood donation";

  if (isBloodDonation) {
    if (!data.bloodGroupNeeded) {
      ctx.addIssue({
        code: "custom",
        path: ["bloodGroupNeeded"],
        message: "Blood group is required for blood donation requests",
      });
    }

    if (!data.hospitalName?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["hospitalName"],
        message: "Hospital name is required for blood donation requests",
      });
    }
  } else {
    if (data.bloodGroupNeeded) {
      ctx.addIssue({
        code: "custom",
        path: ["bloodGroupNeeded"],
        message: "Blood group is only allowed for blood donation requests",
      });
    }

    if (data.hospitalName?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["hospitalName"],
        message: "Hospital name is only allowed for blood donation requests",
      });
    }
  }
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

class CreateRequestDto extends BaseDto<typeof createRequestSchema.shape> {
  constructor() {
    super(createRequestSchema);
  }
}

export default new CreateRequestDto();
