-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM (
  'COMMERCIAL_REGISTRATION',
  'ZATCA_VAT_CERTIFICATE',
  'ZAKAT_ASSESSMENT',
  'CHAMBER_OF_COMMERCE',
  'GOSI_REGISTRATION',
  'QIWA_ESTABLISHMENT',
  'MUDAD_CERTIFICATE',
  'MUQEEM_ACCOUNT',
  'BALADY_LICENSE',
  'CIVIL_DEFENSE_CERT',
  'MINISTRY_OF_INDUSTRY',
  'MINISTRY_OF_HEALTH',
  'MINISTRY_OF_TOURISM',
  'MINISTRY_OF_JUSTICE',
  'MINISTRY_OF_ENVIRONMENT',
  'MINISTRY_OF_CULTURE',
  'MINISTRY_OF_SPORTS',
  'SFDA_LICENSE',
  'SASO_CERTIFICATE',
  'CST_LICENSE',
  'SAMA_LICENSE',
  'CMA_LICENSE',
  'MISA_INVESTMENT_LICENSE',
  'MONSHAAT_REGISTRATION',
  'SOCPA_MEMBERSHIP',
  'SCE_MEMBERSHIP',
  'MHRSD_NITAQAT',
  'OTHER'
);

-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'PARTIAL'
);

-- AlterTable: add new Company fields
ALTER TABLE "Company"
  ADD COLUMN "chamberMembershipNumber" TEXT,
  ADD COLUMN "chamberMembershipExpiry" TIMESTAMP(3),
  ADD COLUMN "mudadWpsCompliant" BOOLEAN,
  ADD COLUMN "mudadLastUpdateDate" TIMESTAMP(3),
  ADD COLUMN "civilDefenseCertNumber" TEXT,
  ADD COLUMN "civilDefenseExpiry" TIMESTAMP(3),
  ADD COLUMN "industryLicenseNumber" TEXT,
  ADD COLUMN "industryLicenseExpiry" TIMESTAMP(3),
  ADD COLUMN "industryActivities" TEXT,
  ADD COLUMN "sfdaLicenseNumber" TEXT,
  ADD COLUMN "sfdaLicenseType" TEXT,
  ADD COLUMN "sfdaLicenseExpiry" TIMESTAMP(3),
  ADD COLUMN "mohLicenseNumber" TEXT,
  ADD COLUMN "mohFacilityType" TEXT,
  ADD COLUMN "mohLicenseExpiry" TIMESTAMP(3),
  ADD COLUMN "tourismLicenseNumber" TEXT,
  ADD COLUMN "tourismClassification" TEXT,
  ADD COLUMN "tourismLicenseExpiry" TIMESTAMP(3),
  ADD COLUMN "cstLicenseNumber" TEXT,
  ADD COLUMN "cstServiceType" TEXT,
  ADD COLUMN "samaLicenseNumber" TEXT,
  ADD COLUMN "samaLicenseType" TEXT,
  ADD COLUMN "cmaLicenseNumber" TEXT,
  ADD COLUMN "cmaLicenseType" TEXT,
  ADD COLUMN "misaLicenseNumber" TEXT,
  ADD COLUMN "misaLicenseExpiry" TIMESTAMP(3),
  ADD COLUMN "sasoCertNumber" TEXT,
  ADD COLUMN "monshaatRegistrationId" TEXT,
  ADD COLUMN "professionalBodyMembershipNumber" TEXT,
  ADD COLUMN "professionalBodyType" TEXT,
  ADD COLUMN "otherDocuments" JSONB;

-- CreateTable
CREATE TABLE "CompanyDocument" (
  "id" TEXT NOT NULL,
  "companyId" TEXT,
  "userId" TEXT NOT NULL,
  "docType" "DocumentType" NOT NULL,
  "originalName" TEXT NOT NULL,
  "storagePath" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSizeBytes" INTEGER NOT NULL,
  "ocrText" TEXT,
  "extractedData" JSONB,
  "extractionVersion" TEXT,
  "extractionConfidence" DOUBLE PRECISION,
  "extractionStatus" "ExtractionStatus" NOT NULL DEFAULT 'PENDING',
  "extractionError" TEXT,
  "extractionStartedAt" TIMESTAMP(3),
  "extractionCompletedAt" TIMESTAMP(3),
  "sessionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CompanyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyDocument_userId_idx" ON "CompanyDocument"("userId");
CREATE INDEX "CompanyDocument_companyId_idx" ON "CompanyDocument"("companyId");
CREATE INDEX "CompanyDocument_docType_idx" ON "CompanyDocument"("docType");
CREATE INDEX "CompanyDocument_sessionId_idx" ON "CompanyDocument"("sessionId");

-- AddForeignKey
ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
