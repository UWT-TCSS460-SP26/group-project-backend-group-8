-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('movie', 'tv');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'moderator', 'admin', 'super_admin', 'owner');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "subject_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "media_id" INTEGER NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "username" TEXT NOT NULL DEFAULT 'anonymous',
    "media_id" INTEGER NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_subject_id_key" ON "users"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_username_key" ON "users"("id", "username");

-- CreateIndex
CREATE INDEX "ratings_media_id_media_type_idx" ON "ratings"("media_id", "media_type");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_user_id_media_id_media_type_key" ON "ratings"("user_id", "media_id", "media_type");

-- CreateIndex
CREATE INDEX "reviews_media_id_media_type_idx" ON "reviews"("media_id", "media_type");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_media_id_media_type_key" ON "reviews"("user_id", "media_id", "media_type");

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_username_fkey" FOREIGN KEY ("user_id", "username") REFERENCES "users"("id", "username") ON DELETE SET DEFAULT ON UPDATE CASCADE;
