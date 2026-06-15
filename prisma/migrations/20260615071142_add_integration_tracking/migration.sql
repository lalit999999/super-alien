-- AlterTable
ALTER TABLE "User" ADD COLUMN     "calendarConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "calendarConnectedAt" TIMESTAMP(3),
ADD COLUMN     "gmailConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gmailConnectedAt" TIMESTAMP(3),
ADD COLUMN     "lastCalendarSync" TIMESTAMP(3),
ADD COLUMN     "lastGmailSync" TIMESTAMP(3),
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
