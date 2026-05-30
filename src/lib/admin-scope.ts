import "server-only";

import prisma from "@/lib/db";
import type { UserRole } from "@prisma/client";
import { getViewerContext } from "@/utils/user.utils";
import { isAllUsersScope } from "@/lib/admin-scope.constants";

/**
 * Resolve which user's data to load for dashboard/jobs reads.
 * Admins may pass subjectUserId to view another account; otherwise data is scoped to the viewer.
 */
export async function resolveScopedUserId(params: {
  viewerId: string;
  viewerRole: UserRole;
  subjectUserId?: string | null;
}): Promise<string> {
  const trimmed = params.subjectUserId?.trim();
  const selfId = params.viewerId;
  if (!trimmed || trimmed === selfId || isAllUsersScope(trimmed)) {
    return selfId;
  }
  if (params.viewerRole !== "ADMIN") {
    throw new Error("Forbidden");
  }
  const user = await prisma.user.findUnique({
    where: { id: trimmed },
    select: { id: true },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return user.id;
}

/** Authenticated owner id for reads/writes; admins may pass another user's id. */
export async function requireSubjectUserId(
  subjectUserId?: string | null,
): Promise<string> {
  const viewer = await getViewerContext();
  if (!viewer) {
    throw new Error("Not authenticated");
  }
  return resolveScopedUserId({
    viewerId: viewer.id,
    viewerRole: viewer.role,
    subjectUserId,
  });
}
