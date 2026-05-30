export const ALL_USERS_SUBJECT_ID = "all";

export function isAllUsersScope(subjectUserId?: string | null): boolean {
  return subjectUserId?.trim() === ALL_USERS_SUBJECT_ID;
}
