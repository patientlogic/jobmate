export const MEETING_RESUME_MAX_SIZE = 5 * 1024 * 1024;

export const MEETING_RESUME_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export function buildResumeDownloadUrl(filePath: string): string {
  return `/api/profile/resume?filePath=${encodeURIComponent(filePath)}`;
}

export function getResumeLabelFromUrl(resumeUrl: string): string {
  if (!resumeUrl) return "Resume";

  try {
    const url = resumeUrl.startsWith("http")
      ? new URL(resumeUrl)
      : new URL(resumeUrl, "http://localhost");
    const filePath = url.searchParams.get("filePath");
    if (filePath) {
      const fileName = filePath.split(/[/\\]/).pop();
      if (fileName) return decodeURIComponent(fileName);
    }
  } catch {
    // fall through
  }

  return "Resume";
}

export function validateMeetingResumeFile(file: File): string | null {
  if (!MEETING_RESUME_MIME_TYPES.includes(file.type as (typeof MEETING_RESUME_MIME_TYPES)[number])) {
    return "Only PDF and Word documents are allowed.";
  }
  if (file.size > MEETING_RESUME_MAX_SIZE) {
    return "File size must be less than 5MB.";
  }
  return null;
}
