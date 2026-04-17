-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FOUNDER', 'TESTER', 'SME_OWNER', 'PROFESSIONAL', 'BLOCKED');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'WITH_PROFESSIONAL', 'WAITING_GOVERNMENT', 'RESOLVED', 'ESCALATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('TELEGRAM', 'WHATSAPP', 'EMAIL', 'SMS');

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
    "email" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "phoneVerifiedAt" TIMESTAMP(3),
    "preferredLanguage" TEXT NOT NULL DEFAULT 'ar',
    "role" "UserRole" NOT NULL DEFAULT 'SME_OWNER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "legalNameAr" TEXT NOT NULL,
    "legalNameEn" TEXT,
    "tradeName" TEXT,
    "businessType" TEXT,
    "ownerLegalName" TEXT,
    "crNumber" TEXT,
    "crIssueDate" TIMESTAMP(3),
    "crExpiryDate" TIMESTAMP(3),
    "zatcaTin" TEXT,
    "vatRegistrationNumber" TEXT,
    "zakatRegistered" BOOLEAN NOT NULL DEFAULT false,
    "gosiEmployerNumber" TEXT,
    "qiwaEstablishmentId" TEXT,
    "molFileNumber" TEXT,
    "saudizationCategory" TEXT,
    "muqeemAccountNumber" TEXT,
    "moi700Number" TEXT,
    "baladyLicenseNumber" TEXT,
    "baladyLicenseType" TEXT,
    "baladyExpiryDate" TIMESTAMP(3),
    "primaryBankName" TEXT,
    "primaryBankIbanEncrypted" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT,
    "summaryAr" TEXT NOT NULL,
    "governmentBody" TEXT NOT NULL,
    "noticeType" TEXT,
    "urgencyLevel" INTEGER NOT NULL,
    "detectedDeadline" TIMESTAMP(3),
    "detectedAmountSar" DECIMAL(12,2),
    "referenceNumber" TEXT,
    "extractedEntities" JSONB,
    "recommendedAction" TEXT NOT NULL,
    "recommendedHandler" TEXT,
    "actionDeadlineHours" INTEGER,
    "penaltyIfIgnored" TEXT,
    "whatToTellHandlerAr" TEXT,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "assignedHandlerName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueNote" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessagingChannel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelType" "ChannelType" NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalHandle" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "MessagingChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelConnectToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelType" "ChannelType" NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelConnectToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
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
    "companyId" TEXT,
    "issueId" TEXT,
    "channelType" "ChannelType" NOT NULL DEFAULT 'TELEGRAM',
    "identifierMatchAttempted" BOOLEAN NOT NULL DEFAULT false,
    "identifierMatchConfidence" DOUBLE PRECISION,
    "identifierMatchReasoning" TEXT,
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
    "aiExtraction" JSONB,
    "aiAction" JSONB,
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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Company_crNumber_key" ON "Company"("crNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Company_zatcaTin_key" ON "Company"("zatcaTin");

-- CreateIndex
CREATE UNIQUE INDEX "Company_gosiEmployerNumber_key" ON "Company"("gosiEmployerNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Company_qiwaEstablishmentId_key" ON "Company"("qiwaEstablishmentId");

-- CreateIndex
CREATE INDEX "Company_ownerId_idx" ON "Company"("ownerId");

-- CreateIndex
CREATE INDEX "Company_crNumber_idx" ON "Company"("crNumber");

-- CreateIndex
CREATE INDEX "Company_zatcaTin_idx" ON "Company"("zatcaTin");

-- CreateIndex
CREATE INDEX "Company_gosiEmployerNumber_idx" ON "Company"("gosiEmployerNumber");

-- CreateIndex
CREATE INDEX "Company_qiwaEstablishmentId_idx" ON "Company"("qiwaEstablishmentId");

-- CreateIndex
CREATE INDEX "Issue_companyId_idx" ON "Issue"("companyId");

-- CreateIndex
CREATE INDEX "Issue_ownerId_idx" ON "Issue"("ownerId");

-- CreateIndex
CREATE INDEX "Issue_status_idx" ON "Issue"("status");

-- CreateIndex
CREATE INDEX "Issue_urgencyLevel_idx" ON "Issue"("urgencyLevel");

-- CreateIndex
CREATE INDEX "Issue_detectedDeadline_idx" ON "Issue"("detectedDeadline");

-- CreateIndex
CREATE INDEX "IssueNote_issueId_idx" ON "IssueNote"("issueId");

-- CreateIndex
CREATE INDEX "MessagingChannel_userId_idx" ON "MessagingChannel"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessagingChannel_channelType_externalId_key" ON "MessagingChannel"("channelType", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelConnectToken_token_key" ON "ChannelConnectToken"("token");

-- CreateIndex
CREATE INDEX "ChannelConnectToken_token_idx" ON "ChannelConnectToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

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
CREATE INDEX "Message_companyId_idx" ON "Message"("companyId");

-- CreateIndex
CREATE INDEX "Message_issueId_idx" ON "Message"("issueId");

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
ALTER TABLE "Company" ADD CONSTRAINT "Company_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueNote" ADD CONSTRAINT "IssueNote_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueNote" ADD CONSTRAINT "IssueNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessagingChannel" ADD CONSTRAINT "MessagingChannel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelConnectToken" ADD CONSTRAINT "ChannelConnectToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

