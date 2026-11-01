ALTER TABLE "request_assignments" DROP CONSTRAINT "request_assignments_pkey";--> statement-breakpoint
ALTER TABLE "request_assignments" ADD PRIMARY KEY ("request_id","volunteer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "one_active_assignment_per_volunteer_uidx" ON "request_assignments" ("volunteer_id") WHERE completed_at is null and cancelled_at is null;--> statement-breakpoint
CREATE INDEX "assignments_request_idx" ON "request_assignments" ("request_id");