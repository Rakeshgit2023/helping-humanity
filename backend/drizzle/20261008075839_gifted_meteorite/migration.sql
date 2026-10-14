ALTER TABLE "user_locations" ADD COLUMN "id" uuid DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "user_locations" DROP CONSTRAINT "user_locations_pkey";--> statement-breakpoint
ALTER TABLE "user_locations" ADD PRIMARY KEY ("id");