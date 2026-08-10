-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'INSTRUCTOR', 'STUDENT');

-- CreateEnum
CREATE TYPE "LicenseCategory" AS ENUM ('A', 'B', 'C', 'D', 'BE', 'CE');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('AKTIV', 'PROVIM', 'PERFUNDUAR');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('REZERVUAR', 'PERFUNDUAR', 'ANULUAR', 'MUNGESE');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('E_DOBET', 'MESATARE', 'MIRE');

-- CreateEnum
CREATE TYPE "QuizCategory" AS ENUM ('SHENJA_RRUGORE', 'RREGULLA', 'SIGURIA', 'PARKIMI', 'PERPARESIA');

-- CreateEnum
CREATE TYPE "QuizDifficulty" AS ENUM ('LEHTE', 'MESATARE', 'VESHTIRE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "emri" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefoni" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "krijuarMe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instructor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specializimi" "LicenseCategory"[],

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "oraFillimit" TEXT NOT NULL,
    "oraMbarimit" TEXT NOT NULL,
    "iZene" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kategoria" "LicenseCategory" NOT NULL,
    "dataRegjistrimit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusi" "StudentStatus" NOT NULL DEFAULT 'AKTIV',
    "oreKryera" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrivingLesson" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "slotId" TEXT,
    "data" DATE NOT NULL,
    "oraFillimit" TEXT NOT NULL,
    "oraMbarimit" TEXT NOT NULL,
    "statusi" "LessonStatus" NOT NULL DEFAULT 'REZERVUAR',
    "shenimet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrivingLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonEvaluation" (
    "id" TEXT NOT NULL,
    "drivingLessonId" TEXT NOT NULL,
    "shenimTekst" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillCategory" (
    "id" TEXT NOT NULL,
    "emri" TEXT NOT NULL,
    "renditja" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SkillCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillRating" (
    "id" TEXT NOT NULL,
    "lessonEvaluationId" TEXT NOT NULL,
    "skillCategoryId" TEXT NOT NULL,
    "vleresimi" "SkillLevel" NOT NULL,

    CONSTRAINT "SkillRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "teksti" TEXT NOT NULL,
    "kategoria" "QuizCategory" NOT NULL,
    "imazhi" TEXT,
    "veshtiresia" "QuizDifficulty" NOT NULL DEFAULT 'MESATARE',
    "aktiv" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAnswer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "teksti" TEXT NOT NULL,
    "eSakte" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuizAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rezultati" DOUBLE PRECISION NOT NULL,
    "kohaSekonda" INTEGER NOT NULL,
    "iKaluar" BOOLEAN NOT NULL,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttemptAnswer" (
    "id" TEXT NOT NULL,
    "quizAttemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerId" TEXT,
    "eSakte" BOOLEAN NOT NULL,

    CONSTRAINT "QuizAttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_userId_key" ON "Instructor"("userId");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_instructorId_data_idx" ON "AvailabilitySlot"("instructorId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilitySlot_instructorId_data_oraFillimit_key" ON "AvailabilitySlot"("instructorId", "data", "oraFillimit");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE INDEX "Student_statusi_idx" ON "Student"("statusi");

-- CreateIndex
CREATE UNIQUE INDEX "DrivingLesson_slotId_key" ON "DrivingLesson"("slotId");

-- CreateIndex
CREATE INDEX "DrivingLesson_studentId_idx" ON "DrivingLesson"("studentId");

-- CreateIndex
CREATE INDEX "DrivingLesson_instructorId_idx" ON "DrivingLesson"("instructorId");

-- CreateIndex
CREATE INDEX "DrivingLesson_data_idx" ON "DrivingLesson"("data");

-- CreateIndex
CREATE UNIQUE INDEX "LessonEvaluation_drivingLessonId_key" ON "LessonEvaluation"("drivingLessonId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillCategory_emri_key" ON "SkillCategory"("emri");

-- CreateIndex
CREATE UNIQUE INDEX "SkillRating_lessonEvaluationId_skillCategoryId_key" ON "SkillRating"("lessonEvaluationId", "skillCategoryId");

-- CreateIndex
CREATE INDEX "QuizQuestion_kategoria_idx" ON "QuizQuestion"("kategoria");

-- CreateIndex
CREATE INDEX "QuizAnswer_questionId_idx" ON "QuizAnswer"("questionId");

-- CreateIndex
CREATE INDEX "QuizAttempt_studentId_idx" ON "QuizAttempt"("studentId");

-- CreateIndex
CREATE INDEX "QuizAttemptAnswer_quizAttemptId_idx" ON "QuizAttemptAnswer"("quizAttemptId");

-- CreateIndex
CREATE INDEX "QuizAttemptAnswer_questionId_idx" ON "QuizAttemptAnswer"("questionId");

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrivingLesson" ADD CONSTRAINT "DrivingLesson_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrivingLesson" ADD CONSTRAINT "DrivingLesson_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrivingLesson" ADD CONSTRAINT "DrivingLesson_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "AvailabilitySlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonEvaluation" ADD CONSTRAINT "LessonEvaluation_drivingLessonId_fkey" FOREIGN KEY ("drivingLessonId") REFERENCES "DrivingLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillRating" ADD CONSTRAINT "SkillRating_lessonEvaluationId_fkey" FOREIGN KEY ("lessonEvaluationId") REFERENCES "LessonEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillRating" ADD CONSTRAINT "SkillRating_skillCategoryId_fkey" FOREIGN KEY ("skillCategoryId") REFERENCES "SkillCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttemptAnswer" ADD CONSTRAINT "QuizAttemptAnswer_quizAttemptId_fkey" FOREIGN KEY ("quizAttemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttemptAnswer" ADD CONSTRAINT "QuizAttemptAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttemptAnswer" ADD CONSTRAINT "QuizAttemptAnswer_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "QuizAnswer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
