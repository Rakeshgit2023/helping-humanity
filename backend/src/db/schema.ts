import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
  date,
  doublePrecision,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import {
  booldGroupValues,
  genderValues,
  roleValues,
} from "../app/comman/utils/constant.js";

export const roleEnum = pgEnum("role", roleValues);

export const genderEnum = pgEnum("gender", genderValues);

export const bloodGroupEnum = pgEnum("blood_group", booldGroupValues);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 322 }).notNull(),
    dob: date("dob"),
    passwordHash: varchar("password", { length: 66 }),
    role: roleEnum("role").notNull().default("user"),
    gender: genderEnum("gender").notNull(),
    avatarUrl: text("avatar_url"),
    isEmailVerified: boolean("is_email_verified").notNull().default(false),
    isBanned: boolean("is_banned").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (t) => [
    uniqueIndex("users_phone_idx").on(t.phone),
    uniqueIndex("users_email_idx").on(t.email),
  ],
);

export const emailVerificationOtps = pgTable(
  "email_verification_otps",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    otpHash: varchar("otp_hash", { length: 255 }).notNull(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("email_verification_otps_user_idx").on(t.userId)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("sessions_user_idx").on(t.userId),
    uniqueIndex("sessions_refresh_token_hash_idx").on(t.refreshTokenHash),
  ],
);

export const volunteerProfiles = pgTable(
  "volunteer_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    bio: text("bio"),
    isVerified: boolean("is_verified").notNull().default(false), // admin-approved
    isAvailable: boolean("is_available").notNull().default(true), // on/off duty toggle
    bloodGroup: bloodGroupEnum("blood_group"), // relevant if interested in blood_donation
    lastLat: doublePrecision("last_lat"),
    lastLng: doublePrecision("last_lng"),
    lastLocationAt: timestamp("last_location_at", { withTimezone: true }),
    ratingAvg: doublePrecision("rating_avg").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    avgResponseMinutes: integer("avg_response_minutes"), // powers the "Avg response" stat
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (t) => [index("volunteer_availability_idx").on(t.isAvailable)],
);

export const category = pgTable(
  "category",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [uniqueIndex("category_name_idx").on(t.name)],
);

export const volunteerInterests = pgTable(
  "volunteer_interests",
  {
    volunteerId: uuid("volunteer_id")
      .notNull()
      .references(() => volunteerProfiles.userId, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.volunteerId, t.categoryId] })],
);
