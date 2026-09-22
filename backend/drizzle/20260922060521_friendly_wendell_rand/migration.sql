CREATE TYPE "blood_group" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');--> statement-breakpoint
CREATE TYPE "broadcast_status" AS ENUM('sent', 'seen', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "priority" AS ENUM('normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "request_status" AS ENUM('draft', 'broadcasted', 'accepted', 'in_progress', 'completed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "role" AS ENUM('user', 'volunteer', 'admin');--> statement-breakpoint
CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_otps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"otp_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_assignments" (
	"request_id" uuid PRIMARY KEY,
	"volunteer_id" uuid NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"in_progress_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "request_broadcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"request_id" uuid NOT NULL,
	"volunteer_id" uuid NOT NULL,
	"distance_km" double precision,
	"status" "broadcast_status" DEFAULT 'sent'::"broadcast_status" NOT NULL,
	"notified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "request_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"request_id" uuid NOT NULL,
	"photo_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"requester_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"address" text,
	"blood_group_needed" "blood_group",
	"hospital_name" varchar(160),
	"priority" "priority" DEFAULT 'normal'::"priority" NOT NULL,
	"status" "request_status" DEFAULT 'broadcasted'::"request_status" NOT NULL,
	"broadcast_radius_km" double precision DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(322) NOT NULL,
	"dob" date,
	"password" varchar(66),
	"role" "role" DEFAULT 'user'::"role" NOT NULL,
	"gender" "gender" NOT NULL,
	"avatar_url" text,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"is_banned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "volunteer_interests" (
	"volunteer_id" uuid,
	"category_id" uuid,
	CONSTRAINT "volunteer_interests_pkey" PRIMARY KEY("volunteer_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "volunteer_profiles" (
	"user_id" uuid PRIMARY KEY,
	"bio" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"blood_group" "blood_group",
	"last_lat" double precision,
	"last_lng" double precision,
	"last_location_at" timestamp with time zone,
	"rating_avg" double precision DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"avg_response_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "category_name_idx" ON "category" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "email_verification_otps_user_idx" ON "email_verification_otps" ("user_id");--> statement-breakpoint
CREATE INDEX "broadcasts_request_idx" ON "request_broadcasts" ("request_id");--> statement-breakpoint
CREATE INDEX "broadcasts_volunteer_idx" ON "request_broadcasts" ("volunteer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "broadcasts_request_volunteer_uidx" ON "request_broadcasts" ("request_id","volunteer_id");--> statement-breakpoint
CREATE INDEX "request_photos_request_idx" ON "request_photos" ("request_id");--> statement-breakpoint
CREATE INDEX "requests_status_idx" ON "requests" ("status");--> statement-breakpoint
CREATE INDEX "requests_category_idx" ON "requests" ("category_id");--> statement-breakpoint
CREATE INDEX "requests_requester_idx" ON "requests" ("requester_id");--> statement-breakpoint
CREATE INDEX "requests_priority_idx" ON "requests" ("priority");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_refresh_token_hash_idx" ON "sessions" ("refresh_token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_idx" ON "users" ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE INDEX "volunteer_availability_idx" ON "volunteer_profiles" ("is_available");--> statement-breakpoint
ALTER TABLE "email_verification_otps" ADD CONSTRAINT "email_verification_otps_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "request_assignments" ADD CONSTRAINT "request_assignments_request_id_requests_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "request_assignments" ADD CONSTRAINT "request_assignments_volunteer_id_users_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "request_broadcasts" ADD CONSTRAINT "request_broadcasts_request_id_requests_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "request_broadcasts" ADD CONSTRAINT "request_broadcasts_volunteer_id_users_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "request_photos" ADD CONSTRAINT "request_photos_request_id_requests_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_requester_id_users_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_category_id_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "volunteer_interests" ADD CONSTRAINT "volunteer_interests_eFSoaxCdLH1P_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "volunteer_profiles"("user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "volunteer_interests" ADD CONSTRAINT "volunteer_interests_category_id_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;