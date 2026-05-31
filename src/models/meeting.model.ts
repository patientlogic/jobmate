export const INTERVIEW_STEPS = [
  { id: "1st step", label: "1st step", value: "1st step" },
  { id: "2nd step", label: "2nd step", value: "2nd step" },
  { id: "3rd step", label: "3rd step", value: "3rd step" },
  { id: "4th step", label: "4th step", value: "4th step" },
  { id: "5th step", label: "5th step", value: "5th step" },
] as const;

export const MEETING_TYPES = [
  { id: "Introduction", label: "Introduction", value: "Introduction" },
  { id: "Technical", label: "Technical", value: "Technical" },
  { id: "Onboarding", label: "Onboarding", value: "Onboarding" },
  { id: "Final", label: "Final", value: "Final" },
  { id: "Live Coding", label: "Live Coding", value: "Live Coding" },
  { id: "Discuss", label: "Discuss", value: "Discuss" },
  { id: "Offer", label: "Offer", value: "Offer" },
  { id: "Catch up", label: "Catch up", value: "Catch up" },
] as const;

export const MEETING_STATUSES = [
  { id: "Waiting", label: "Waiting", value: "Waiting" },
  { id: "Scheduled", label: "Scheduled", value: "Scheduled" },
  { id: "Cancelled", label: "Cancelled", value: "Cancelled" },
  { id: "Passed", label: "Passed", value: "Passed" },
  { id: "Rejected", label: "Rejected", value: "Rejected" },
  { id: "Failed", label: "Failed", value: "Failed" },
  { id: "In progress", label: "In progress", value: "In progress" },
  { id: "Done", label: "Done", value: "Done" },
] as const;

export const MEETING_AREAS = [
  { id: "EU", label: "EU", value: "EU" },
  { id: "US", label: "US", value: "US" },
] as const;

export type MeetingStatus = (typeof MEETING_STATUSES)[number]["value"];
export type MeetingType = (typeof MEETING_TYPES)[number]["value"];
export type InterviewStep = (typeof INTERVIEW_STEPS)[number]["value"];
export type MeetingArea = (typeof MEETING_AREAS)[number]["value"];

export type AppliedJobOption = {
  id: string;
  label: string;
};

export type MeetingResumeOption = {
  id: string;
  label: string;
  url: string;
};

export type MeetingJobPrefill = {
  positionRole: string;
  companyName: string;
  address: string;
  salaryExpectation: string;
  resumeUrl: string;
  jobDescription: string;
};

export type DeveloperOption = {
  id: string;
  label: string;
  value: string;
};

export const UNASSIGNED_DEVELOPER = "__unassigned__";

export type Meeting = {
  id: string;
  mid: number;
  userId: string;
  jobId: string;
  assignedDeveloperId: string | null;
  positionRole: string;
  accountName: string;
  startTime: Date;
  endTime: Date;
  timeZone: string;
  companyName: string;
  meetingLink: string | null;
  interviewStep: string;
  meetingType: string;
  status: string;
  area: string | null;
  address: string | null;
  dob: Date | null;
  resumeUrl: string | null;
  salaryExpectation: string | null;
  jobDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  User?: { id: string; name: string };
  AssignedDeveloper?: { id: string; name: string };
  jobJid?: number;
};
