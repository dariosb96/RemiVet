-- CreateIndex
CREATE INDEX "Appointment_serviceId_startAt_idx" ON "public"."Appointment"("serviceId", "startAt");
