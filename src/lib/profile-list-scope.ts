import "server-only";

import { resolveScopedUserId } from "@/lib/admin-scope";
import { isAllUsersScope } from "@/lib/admin-scope.constants";
import { getViewerContext } from "@/utils/user.utils";

export async function resolveProfileListScope(subjectUserId?: string) {
  const viewer = await getViewerContext();
  if (!viewer) {
    throw new Error("Not authenticated");
  }

  const isAllUsers =
    viewer.role === "ADMIN" && isAllUsersScope(subjectUserId);
  if (isAllUsers) {
    return { isAllUsers: true as const, userId: undefined };
  }

  const userId = await resolveScopedUserId({
    viewerId: viewer.id,
    viewerRole: viewer.role,
    subjectUserId,
  });
  return { isAllUsers: false as const, userId };
}

export function profileOwnerWhere(isAllUsers: boolean, userId?: string) {
  return isAllUsers || !userId ? {} : { profile: { userId } };
}

export const profileOwnerSelect = {
  profile: {
    select: {
      userId: true,
      user: { select: { id: true, name: true } },
    },
  },
} as const;
