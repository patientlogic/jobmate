export const AVATAR_MAX_SIZE = 2 * 1024 * 1024;

export const AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export function buildAvatarUrl(filePath: string): string {
  return `/api/my-profile/avatar?filePath=${encodeURIComponent(filePath)}`;
}

export function validateAvatarFile(file: File): string | null {
  if (
    !AVATAR_MIME_TYPES.includes(file.type as (typeof AVATAR_MIME_TYPES)[number])
  ) {
    return "Only JPG, PNG, WebP, and GIF images are allowed.";
  }
  if (file.size > AVATAR_MAX_SIZE) {
    return "Image must be less than 2MB.";
  }
  return null;
}
