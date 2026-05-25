import "server-only";

import prisma from "@/lib/db";
import type { UserRole } from "@prisma/client";

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
  if (!trimmed || trimmed === selfId) {
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
