import "server-only";
import { auth } from "@/auth";
import { CurrentUser } from "@/models/user.model";
import { UserRole } from "@prisma/client";

export type ViewerContext = CurrentUser & { role: UserRole };

function sessionRoleToUserRole(raw?: string): UserRole {
  return raw === "ADMIN" ? UserRole.ADMIN : UserRole.USER;
}

/** Authenticated viewer including role for admin authorization. */
export async function getViewerContext(): Promise<ViewerContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user: ViewerContext = {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: sessionRoleToUserRole(session.user.role),
  };
  return user;
}

/** Public profile fields for actions that scope data to `userId`. */
export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  const viewer = await getViewerContext();
  if (!viewer) return null;
  return {
    id: viewer.id,
    name: viewer.name,
    email: viewer.email,
  };
};
