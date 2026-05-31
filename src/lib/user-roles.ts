import { UserRole } from "@prisma/client";

export function parseUserRole(raw?: string | null): UserRole {
  switch (raw) {
    case UserRole.ADMIN:
      return UserRole.ADMIN;
    case UserRole.DEVELOPER:
      return UserRole.DEVELOPER;
    default:
      return UserRole.USER;
  }
}

export function isAdminRole(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

export function isDeveloperRole(role: UserRole): boolean {
  return role === UserRole.DEVELOPER;
}

export function canAccessAssignedMeetings(role: UserRole): boolean {
  return isAdminRole(role) || isDeveloperRole(role);
}

export function canAccessMyMeetings(role: UserRole): boolean {
  return !isDeveloperRole(role);
}

export function canAccessDeveloperOptions(
  role: UserRole,
  isDevelopment = process.env.NODE_ENV === "development",
): boolean {
  return isDevelopment || isAdminRole(role) || isDeveloperRole(role);
}

export function formatUserRoleLabel(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return "Admin";
    case UserRole.DEVELOPER:
      return "Developer";
    default:
      return "User";
  }
}
