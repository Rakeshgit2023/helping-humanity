import z from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import BaseDto from "../../../comman/dto/base.dto.js";
import {
  bloodGroupValues,
  priorityValues,
} from "../../../comman/utils/constant.js";

extendZodWithOpenApi(z);

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

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
  category: z
    .preprocess((value) => {
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    }, categorySchema)
    .openapi({
      type: "string",
      description: "JSON string of the category object",
      example:
        '{"id":"60a6f88b-9b50-49a6-9307-a5861282d440","name":"animal rescue"}',
    }),

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

address: z.preprocess(
  emptyToUndefined,
  z.string().max(250, "Address must not exceed 250 characters").optional(),
),

  bloodGroupNeeded: z.preprocess(emptyToUndefined, z.enum(bloodGroupValues).optional()),

hospitalName: z.preprocess(
  emptyToUndefined,
  z.string().max(160, "Hospital name must not exceed 160 characters").optional(),
),

  priority: z.enum(priorityValues).default("normal"),

  broadcastRadiusKm: z.coerce
    .number()
    .positive("Broadcast radius must be greater than 0")
    .max(10, "Broadcast radius must not exceed 10 km")
    .default(3),

  totalVolunteersNeeded: z.coerce
    .number()
    .int("Total volunteers needed must be an integer")
    .positive("Total volunteers needed must be greater than 0")
    .max(10, "Total volunteers needed must not exceed 10")
    .default(1),

  expiresAt: z.iso.datetime().optional(),
});
export const createRequestSchema = baseCreateRequestSchema.superRefine(
  (data, ctx) => {
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
  },
);

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const createRequestResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    id: z.uuid(),
    title: z.string(),
    description: z.string().nullable(),
    categoryId: z.uuid(),
    lat: z.number(),
    lng: z.number(),
    address: z.string().nullable(),
    bloodGroupNeeded: z.string().nullable(),
    hospitalName: z.string().nullable(),
    priority: z.string(),
    status: z.string(),
    broadcastRadiusKm: z.number(),
    totalVolunteersNeeded: z.number(),
    expiresAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
  }),
});

export type CreateRequestResponseInput = z.infer<
  typeof createRequestResponseSchema
>;

class CreateRequestDto extends BaseDto<typeof createRequestSchema.shape> {
  constructor() {
    super(createRequestSchema);
  }
}

export default new CreateRequestDto();
