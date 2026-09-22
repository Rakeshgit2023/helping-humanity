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

export const priorityValues = ["normal", "high", "urgent"] as const;

export const requestStatusValues = [
  "draft", // saved but not yet submitted
  "broadcasted", // sent to nearby volunteers, open to accept ("New request nearby" / "More requests near you" are both just this status)
  "accepted", // exactly one volunteer has claimed it
  "in_progress", // volunteer en route / actively handling it
  "completed",
  "cancelled",
  "expired", // no volunteer accepted within the SLA window
] as const;

export const broadcastStatusValues = [
  "sent",
  "seen",
  "accepted",
  "declined",
  "expired", // someone else accepted first, or the notification timed out
] as const;
