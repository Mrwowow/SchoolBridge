-- CreateEnum
CREATE TYPE "BehaviourLevel" AS ENUM ('NEEDS_WORK', 'GOOD', 'EXCELLENT');

-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "arrivedAt" TIMESTAMP(3),
ADD COLUMN     "mood" TEXT;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "audioUrl" TEXT;

-- AlterTable
ALTER TABLE "replies" ADD COLUMN     "audioUrl" TEXT;

-- CreateTable
CREATE TABLE "day_subject_notes" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "pupilId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "topic" TEXT NOT NULL,
    "note" TEXT,
    "score" INTEGER,
    "maxScore" INTEGER,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "day_subject_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behaviour_ratings" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "pupilId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "label" TEXT NOT NULL,
    "value" "BehaviourLevel" NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "behaviour_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework_submissions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "pupilId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homework_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pupil_badges" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "pupilId" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sub" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pupil_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "day_subject_notes_schoolId_pupilId_date_idx" ON "day_subject_notes"("schoolId", "pupilId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "day_subject_notes_pupilId_subjectId_date_key" ON "day_subject_notes"("pupilId", "subjectId", "date");

-- CreateIndex
CREATE INDEX "behaviour_ratings_schoolId_pupilId_date_idx" ON "behaviour_ratings"("schoolId", "pupilId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "behaviour_ratings_pupilId_date_label_key" ON "behaviour_ratings"("pupilId", "date", "label");

-- CreateIndex
CREATE INDEX "homework_submissions_pupilId_idx" ON "homework_submissions"("pupilId");

-- CreateIndex
CREATE UNIQUE INDEX "homework_submissions_messageId_pupilId_key" ON "homework_submissions"("messageId", "pupilId");

-- CreateIndex
CREATE INDEX "pupil_badges_pupilId_idx" ON "pupil_badges"("pupilId");

-- AddForeignKey
ALTER TABLE "day_subject_notes" ADD CONSTRAINT "day_subject_notes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_subject_notes" ADD CONSTRAINT "day_subject_notes_pupilId_fkey" FOREIGN KEY ("pupilId") REFERENCES "pupils"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_subject_notes" ADD CONSTRAINT "day_subject_notes_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behaviour_ratings" ADD CONSTRAINT "behaviour_ratings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behaviour_ratings" ADD CONSTRAINT "behaviour_ratings_pupilId_fkey" FOREIGN KEY ("pupilId") REFERENCES "pupils"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_pupilId_fkey" FOREIGN KEY ("pupilId") REFERENCES "pupils"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pupil_badges" ADD CONSTRAINT "pupil_badges_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pupil_badges" ADD CONSTRAINT "pupil_badges_pupilId_fkey" FOREIGN KEY ("pupilId") REFERENCES "pupils"("id") ON DELETE CASCADE ON UPDATE CASCADE;

