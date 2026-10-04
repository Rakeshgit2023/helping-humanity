CREATE TABLE "user_locations" (
	"user_id" uuid PRIMARY KEY,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "volunteer_profiles" DROP COLUMN "last_lat";--> statement-breakpoint
ALTER TABLE "volunteer_profiles" DROP COLUMN "last_lng";--> statement-breakpoint
ALTER TABLE "volunteer_profiles" DROP COLUMN "last_location_at";--> statement-breakpoint
CREATE INDEX "user_locations_lat_lng_idx" ON "user_locations" ("lat","lng");--> statement-breakpoint
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;