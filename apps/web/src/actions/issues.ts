"use server";

import { IssueStatus, prisma } from "@makyn/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/session";

const statusSchema = z.nativeEnum(IssueStatus);

async function ensureIssueOwned(issueId: string, userId: string) {
  const issue = await prisma.issue.findFirst({
    where: { id: issueId, ownerId: userId },
    select: { id: true, companyId: true }
  });
  return issue;
}

export async function updateIssueStatusAction(issueId: string, formData: FormData) {
  const user = await requireUser();
  const issue = await ensureIssueOwned(issueId, user.id);
  if (!issue) return;

  const status = statusSchema.parse(formData.get("status"));
  const resolutionNotes = formData.get("resolutionNotes")?.toString().trim() || null;

  await prisma.issue.update({
    where: { id: issueId },
    data: {
      status,
      resolvedAt: status === IssueStatus.RESOLVED ? new Date() : null,
      resolutionNotes
    }
  });

  revalidatePath(`/companies/${issue.companyId}`);
  revalidatePath(`/companies/${issue.companyId}/issues/${issueId}`);
}

export async function assignHandlerAction(issueId: string, formData: FormData) {
  const user = await requireUser();
  const issue = await ensureIssueOwned(issueId, user.id);
  if (!issue) return;

  const name = formData.get("assignedHandlerName")?.toString().trim() || null;
  await prisma.issue.update({
    where: { id: issueId },
    data: { assignedHandlerName: name }
  });

  revalidatePath(`/companies/${issue.companyId}/issues/${issueId}`);
}

export async function addIssueNoteAction(issueId: string, formData: FormData) {
  const user = await requireUser();
  const issue = await ensureIssueOwned(issueId, user.id);
  if (!issue) return;

  const content = formData.get("content")?.toString().trim();
  if (!content) return;

  await prisma.issueNote.create({
    data: {
      issueId,
      authorId: user.id,
      content
    }
  });

  revalidatePath(`/companies/${issue.companyId}/issues/${issueId}`);
}
