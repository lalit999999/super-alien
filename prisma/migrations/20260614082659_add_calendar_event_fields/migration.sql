-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "attendees" JSONB,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "organizer" TEXT,
ADD COLUMN     "status" TEXT;
