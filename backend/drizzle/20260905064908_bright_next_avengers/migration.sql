CREATE TABLE "interests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(50) NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "user_interests" (
	"user_id" uuid,
	"interest_id" uuid,
	CONSTRAINT "user_interests_pkey" PRIMARY KEY("user_id","interest_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"first_name" varchar(45) NOT NULL,
	"last_name" varchar(45) NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"email" varchar(322) NOT NULL UNIQUE,
	"mobile_number" varchar(20) NOT NULL UNIQUE,
	"state" varchar(100) NOT NULL,
	"dob" date NOT NULL,
	"refresh_token" text,
	"password" varchar(66),
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verification_otp" varchar(6),
	"email_verification_otp_expires_at" timestamp,
	"reset_password_otp" varchar(6),
	"reset_password_otp_expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_interest_id_interests_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "interests"("id") ON DELETE CASCADE;