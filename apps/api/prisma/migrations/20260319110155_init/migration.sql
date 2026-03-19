-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('DAILY', 'WEEKLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('PUSH', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#888780',
    "icon" TEXT NOT NULL DEFAULT 'folder',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "Frequency" NOT NULL DEFAULT 'DAILY',
    "target_days" TEXT[],
    "target_count" INTEGER NOT NULL DEFAULT 1,
    "color" TEXT NOT NULL DEFAULT '#5DCAA5',
    "icon" TEXT NOT NULL DEFAULT 'check',
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_logs" (
    "id" TEXT NOT NULL,
    "habit_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "logged_date" DATE NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "value" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streaks" (
    "id" TEXT NOT NULL,
    "habit_id" TEXT NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_completed_date" DATE,
    "streak_start_date" DATE,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "habit_id" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "days" TEXT[],
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "channel" "Channel" NOT NULL DEFAULT 'PUSH',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "habit_id" TEXT NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "completion_count" INTEGER NOT NULL,
    "completion_rate" DOUBLE PRECISION NOT NULL,
    "total_days" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accountability_partners" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "accountability_partners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "habit_logs_user_id_logged_date_idx" ON "habit_logs"("user_id", "logged_date");

-- CreateIndex
CREATE UNIQUE INDEX "habit_logs_habit_id_logged_date_key" ON "habit_logs"("habit_id", "logged_date");

-- CreateIndex
CREATE UNIQUE INDEX "streaks_habit_id_key" ON "streaks"("habit_id");

-- CreateIndex
CREATE INDEX "analytics_snapshots_user_id_snapshot_date_idx" ON "analytics_snapshots"("user_id", "snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_snapshots_habit_id_snapshot_date_key" ON "analytics_snapshots"("habit_id", "snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "accountability_partners_user_id_partner_id_key" ON "accountability_partners"("user_id", "partner_id");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accountability_partners" ADD CONSTRAINT "accountability_partners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accountability_partners" ADD CONSTRAINT "accountability_partners_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
