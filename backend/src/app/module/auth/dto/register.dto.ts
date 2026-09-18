import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";
import {
  booldGroupValues,
  genderValues,
  roleValues,
} from "../../../comman/utils/constant.js";

const baseRegisterSchema = z.object({
  firstName: z
    .string({
      error: "First name is required",
    })
    .min(2, "First name must be at least 2 characters long")
    .max(100, "First name cannot exceed 100 characters"),
  lastName: z
    .string({
      error: "Last name is required",
    })
    .min(2, "Last name must be at least 2 characters long")
    .max(100, "Last name cannot exceed 100 characters"),
  email: z.string({ error: "Email is required" }).email("Invalid email format"),
  dob: z
    .string({
      error: "Date of birth is required",
    })
    .regex(/^\d{2}-\d{2}-\d{4}$/, "Date of birth must be in DD-MM-YYYY format"),

  phone: z
    .string({
      error: "Phone number is required",
    })
    .regex(/^[6-9]\d{9}$/, "Phone number must be a valid 10-digit number"),
  role: z
    .enum(roleValues, {
      error: "Role must be user, volunteer, or admin",
    })
    .optional(),

  gender: z.enum(genderValues, {
    error: "Gender must be male, female, or other",
  }),

  password: z
    .string({
      error: "Password is required",
    })
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password cannot exceed 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
  bloodGroup: z.enum(booldGroupValues).optional(),
  interests: z
    .array(z.uuid("Each interest must be a valid category id"))
    .min(1, "At least 1 interest is required")
    .max(5, "You can select up to 5 interests")
    .refine((arr) => new Set(arr).size === arr.length, {
      message: "Duplicate interests are not allowed",
    })
    .optional(),
});

const registerSchema = baseRegisterSchema.superRefine((data, ctx) => {
  if (data.role !== "volunteer") return;

  if (!data.interests || data.interests.length === 0) {
    ctx.addIssue({
      code: "custom",
      path: ["interests"],
      message: "Select at least one interest to register as a volunteer",
    });
  }

  if (!data.bloodGroup) {
    ctx.addIssue({
      code: "custom",
      path: ["bloodGroup"],
      message: "Blood group is required to register as a volunteer",
    });
  }
});

export type RegisterInput = z.infer<typeof registerSchema>;

class RegisterDto extends BaseDto<typeof registerSchema.shape> {
  constructor() {
    super(registerSchema);
  }
}

export default new RegisterDto();
