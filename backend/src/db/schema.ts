import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  timestamp,
  primaryKey,
  boolean,
} from "drizzle-orm/pg-core";

// ====================
// Interests Table
// ====================

export const interestTable = pgTable("interests", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", {
    length: 50,
  })
    .notNull()
    .unique(),
});

// ====================
// Users Table
// ====================

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  firstName: varchar("first_name", {
    length: 45,
  }).notNull(),

  lastName: varchar("last_name", {
    length: 45,
  }).notNull(),

  role: varchar("role", {
    length: 20,
  })
    .notNull()
    .default("user"),

  email: varchar("email", {
    length: 322,
  })
    .notNull()
    .unique(),

  mobileNumber: varchar("mobile_number", {
    length: 20,
  })
    .unique()
    .notNull(),

  state: varchar("state", {
    length: 100,
  }).notNull(),

  dob: date("dob").notNull(),

  refreshToken: text("refresh_token"),
  password: varchar("password", { length: 66 }),

  emailVerified: boolean("email_verified").default(false).notNull(),

  emailVerificationOtp: text("email_verification_otp"),
  emailVerificationOtpExpiresAt: timestamp("email_verification_otp_expires_at"),

  resetPasswordOtp: text("reset_password_otp"),
  resetPasswordOtpExpiresAt: timestamp("reset_password_otp_expires_at"),

  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

// ====================
// User Interests Table
// ====================

export const userInterestsTable = pgTable(
  "user_interests",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
      }),

    interestId: uuid("interest_id")
      .notNull()
      .references(() => interestTable.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.interestId],
    }),
  ],
);
