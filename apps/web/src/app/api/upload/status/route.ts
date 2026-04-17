import { prisma } from "@makyn/db";
import { NextRequest, NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/session";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const sessionId = searchParams.get("sessionId");
  const documentId = searchParams.get("documentId");

  if (!sessionId && !documentId) {
    return NextResponse.json({ error: "Provide sessionId or documentId" }, { status: 400 });
  }

  const docs = await prisma.companyDocument.findMany({
    where: {
      userId: session.user.id,
      ...(documentId ? { id: documentId } : { sessionId })
    },
    select: {
      id: true,
      docType: true,
      originalName: true,
      extractionStatus: true,
      extractedData: true,
      extractionConfidence: true,
      extractionError: true,
      extractionCompletedAt: true
    }
  });

  return NextResponse.json({ documents: docs });
}
