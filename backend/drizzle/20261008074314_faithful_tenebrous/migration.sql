ALTER TABLE "user_locations" RENAME COLUMN "updated_at" TO "recorded_at";--> statement-breakpoint
ALTER INDEX "user_locations_lat_lng_idx" RENAME TO "user_locations_user_recorded_uq";--> statement-breakpoint
ALTER TABLE "user_locations" ALTER COLUMN "recorded_at" DROP DEFAULT;--> statement-breakpoint
DROP INDEX "user_locations_user_recorded_uq";--> statement-breakpoint
CREATE UNIQUE INDEX "user_locations_user_recorded_uq" ON "user_locations" ("user_id","recorded_at");