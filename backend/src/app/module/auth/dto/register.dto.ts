import z from "zod";
import BaseDto from "../../../comman/dto/base.dto.js";

const registerSchema = z.object({
  firstName: z
    .string({
      error: "First name is required",
    })
    .min(2, "First name must be at least 2 characters long")
    .max(50, "First name cannot exceed 50 characters"),
  lastName: z
    .string({
      error: "Last name is required",
    })
    .min(2, "Last name must be at least 2 characters long")
    .max(50, "Last name cannot exceed 50 characters"),
  email: z.string({ error: "Email is required" }).email("Invalid email format"),
  dob: z
    .string({
      error: "Date of birth is required",
    })
    .regex(/^\d{2}-\d{2}-\d{4}$/, "Date of birth must be in DD-MM-YYYY format"),

  mobileNumber: z
    .string({
      error: "Mobile number is required",
    })
    .regex(/^[6-9]\d{9}$/, "Mobile number must be a valid 10-digit number"),
  state: z.string({
    error: "State is required",
  }),
  role: z
    .enum(["user", "voluntier", "admin"], {
      error: "Role must be user, voluntier, or admin",
    })
    .optional(),
  interestIds: z
    .array(z.string().uuid("Each interest ID must be a valid UUID"), {
      error: "Interests are required",
    })
    .min(1, "At least one interest is required")
    .max(5, "A maximum of 5 interests are allowed")
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Same interest are not allowed",
    ),

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
});

export type RegisterInput = z.infer<typeof registerSchema>;

class RegisterDto extends BaseDto<typeof registerSchema.shape> {
  constructor() {
    super(registerSchema);
  }
}

export default new RegisterDto();
