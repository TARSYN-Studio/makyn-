"use server";

import { IssueStatus, prisma } from "@makyn/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { writeAudit } from "@/lib/audit";
import { requireOrgAccess, OrgAccessError } from "@/lib/permissions";
import { requireUser } from "@/lib/session";

const statusSchema = z.nativeEnum(IssueStatus);

// Resolve an issue by id, verify the caller is a member of its org. Issues
// in the manual-routing queue (organizationId === null) cannot be mutated
// via these actions — they must be routed to an org first.
async function resolveIssueForWrite(
  issueId: string,
  userId: string,
  action: "issue.update" | "note.create"
): Promise<{ id: string; organizationId: string } | null> {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true, organizationId: true }
  });
  if (!issue?.organizationId) return null;
  try {
    await requireOrgAccess(userId, issue.organizationId, action);
  } catch (e) {
    if (e instanceof OrgAccessError) return null;
    throw e;
  }
  return { id: issue.id, organizationId: issue.organizationId };
}

export async function updateIssueStatusAction(issueId: string, formData: FormData) {
  const user = await requireUser();
  const issue = await resolveIssueForWrite(issueId, user.id, "issue.update");
  if (!issue) return;

  const status = statusSchema.parse(formData.get("status"));
  const resolutionNotes = formData.get("resolutionNotes")?.toString().trim() || null;

  const before = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { status: true, resolutionNotes: true, resolvedAt: true }
  });
  const after = await prisma.issue.update({
    where: { id: issueId },
    data: {
      status,
      resolvedAt: status === IssueStatus.RESOLVED ? new Date() : null,
      resolutionNotes
    },
    select: { status: true, resolutionNotes: true, resolvedAt: true }
  });

  await writeAudit({
    actorUserId: user.id,
    organizationId: issue.organizationId,
    entityType: "issue",
    entityId: issueId,
    action: "issue.status_change",
    before,
    after
  });

  revalidatePath(`/organizations/${issue.organizationId}`);
  revalidatePath(`/organizations/${issue.organizationId}/issues/${issueId}`);
}

export async function assignHandlerAction(issueId: string, formData: FormData) {
  const user = await requireUser();
  const issue = await resolveIssueForWrite(issueId, user.id, "issue.update");
  if (!issue) return;

  const name = formData.get("assignedHandlerName")?.toString().trim() || null;
  const before = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { assignedHandlerName: true }
  });
  const after = await prisma.issue.update({
    where: { id: issueId },
    data: { assignedHandlerName: name },
    select: { assignedHandlerName: true }
  });

  await writeAudit({
    actorUserId: user.id,
    organizationId: issue.organizationId,
    entityType: "issue",
    entityId: issueId,
    action: "issue.update",
    before,
    after
  });

  revalidatePath(`/organizations/${issue.organizationId}/issues/${issueId}`);
}

export async function addIssueNoteAction(issueId: string, formData: FormData) {
  const user = await requireUser();
  const issue = await resolveIssueForWrite(issueId, user.id, "note.create");
  if (!issue) return;

  const content = formData.get("content")?.toString().trim();
  if (!content) return;

  const note = await prisma.issueNote.create({
    data: {
      issueId,
      authorId: user.id,
      content
    },
    select: { id: true, content: true }
  });

  await writeAudit({
    actorUserId: user.id,
    organizationId: issue.organizationId,
    entityType: "issue_note",
    entityId: note.id,
    action: "note.create",
    after: { content: note.content, issueId }
  });

  revalidatePath(`/organizations/${issue.organizationId}/issues/${issueId}`);
}
