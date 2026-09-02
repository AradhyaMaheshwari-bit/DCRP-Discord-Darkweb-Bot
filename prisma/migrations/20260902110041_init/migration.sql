-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'revoked', 'banned');

-- CreateTable
CREATE TABLE "darkweb_users" (
    "id" TEXT NOT NULL,
    "discord_id" TEXT,
    "darkweb_tag" VARCHAR(4) NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "darkweb_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "darkweb_messages" (
    "id" TEXT NOT NULL,
    "discord_user_id" TEXT,
    "darkweb_tag" VARCHAR(4) NOT NULL,
    "content" TEXT NOT NULL,
    "discord_message_id" TEXT,
    "reply_to_message_id" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMP(3),

    CONSTRAINT "darkweb_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_config" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "bot_config_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "darkweb_users_discord_id_key" ON "darkweb_users"("discord_id");

-- CreateIndex
CREATE UNIQUE INDEX "darkweb_users_darkweb_tag_key" ON "darkweb_users"("darkweb_tag");

-- AddForeignKey
ALTER TABLE "darkweb_messages" ADD CONSTRAINT "darkweb_messages_discord_user_id_fkey" FOREIGN KEY ("discord_user_id") REFERENCES "darkweb_users"("discord_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "darkweb_messages" ADD CONSTRAINT "darkweb_messages_reply_to_message_id_fkey" FOREIGN KEY ("reply_to_message_id") REFERENCES "darkweb_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
