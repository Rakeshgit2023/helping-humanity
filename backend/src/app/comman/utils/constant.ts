export const roleValues = ["user", "volunteer", "admin"] as const;
export type Role = (typeof roleValues)[number];

export const genderValues = ["male", "female", "other"] as const;
export const booldGroupValues = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;
