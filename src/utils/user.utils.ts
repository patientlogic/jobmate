import "server-only";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { CurrentUser } from "@/models/user.model";
import { UserRole } from "@prisma/client";
import { parseUserRole } from "@/lib/user-roles";

export type ViewerContext = CurrentUser & { role: UserRole };

/** Authenticated viewer including role for admin authorization. */
export async function getViewerContext(): Promise<ViewerContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user: ViewerContext = {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: parseUserRole(session.user.role),
  };
  return user;
}

/** Public profile fields for actions that scope data to `userId`. */
export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  const viewer = await getViewerContext();
  if (!viewer) return null;

  const profile = await prisma.userProfile.findUnique({
    where: { userId: viewer.id },
    select: { avatarUrl: true, displayName: true },
  });

  return {
    id: viewer.id,
    name: viewer.name,
    email: viewer.email,
    displayName: profile?.displayName || viewer.name,
    avatarUrl: profile?.avatarUrl ?? null,
  };
};
