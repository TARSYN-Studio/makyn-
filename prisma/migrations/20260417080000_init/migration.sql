-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FOUNDER', 'TESTER', 'SME_OWNER', 'PROFESSIONAL', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'AWAITING_FOUNDER_REVIEW', 'AWAITING_PROFESSIONAL', 'RESOLVED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('TEXT', 'PHOTO', 'DOCUMENT', 'VOICE');

-- CreateEnum
CREATE TYPE "FounderAction" AS ENUM ('APPROVED', 'EDITED', 'REJECTED', 'PENDING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "telegramUsername" TEXT,
    "displayName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TESTER',
    "businessName" TEXT,
    "businessType" TEXT,
    "companyCR" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'ar',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "topicSummary" TEXT,
    "primaryCategory" TEXT,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "rawContent" TEXT,
    "mediaFileId" TEXT,
    "mediaLocalPath" TEXT,
    "extractedText" TEXT,
    "detectedGovernmentBody" TEXT,
    "detectedCategory" TEXT,
    "detectedUrgency" INTEGER,
    "detectedDeadline" TIMESTAMP(3),
    "detectedAmountSar" DECIMAL(12,2),
    "aiClassification" JSONB,
    "aiResponseDraft" TEXT,
    "aiConfidence" DOUBLE PRECISION,
    "aiPromptVersion" TEXT,
    "wasSentAutomatically" BOOLEAN NOT NULL DEFAULT false,
    "founderReviewed" BOOLEAN NOT NULL DEFAULT false,
    "founderAction" "FounderAction",
    "founderEditedResponse" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernmentBody" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "commonNoticeTypes" JSONB NOT NULL,
    "typicalUrgency" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernmentBody_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoticeTypeTemplate" (
    "id" TEXT NOT NULL,
    "governmentBodyCode" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "keywordsAr" TEXT[],
    "keywordsEn" TEXT[],
    "defaultUrgency" INTEGER NOT NULL,
    "requiresProfessional" BOOLEAN NOT NULL,
    "typicalDeadlineDays" INTEGER,
    "responseTemplateAr" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoticeTypeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "userId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "User_telegramId_idx" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");

-- CreateIndex
CREATE INDEX "Conversation_status_idx" ON "Conversation"("status");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_direction_idx" ON "Message"("direction");

-- CreateIndex
CREATE INDEX "Message_detectedGovernmentBody_idx" ON "Message"("detectedGovernmentBody");

-- CreateIndex
CREATE INDEX "Message_detectedUrgency_idx" ON "Message"("detectedUrgency");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GovernmentBody_code_key" ON "GovernmentBody"("code");

-- CreateIndex
CREATE UNIQUE INDEX "NoticeTypeTemplate_code_key" ON "NoticeTypeTemplate"("code");

-- CreateIndex
CREATE INDEX "NoticeTypeTemplate_governmentBodyCode_idx" ON "NoticeTypeTemplate"("governmentBodyCode");

-- CreateIndex
CREATE INDEX "AuditLog_eventType_idx" ON "AuditLog"("eventType");

-- CreateIndex
CREATE INDEX "AuditLog_occurredAt_idx" ON "AuditLog"("occurredAt");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
