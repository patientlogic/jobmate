"use server";

import prisma from "@/lib/db";
import { APP_CONSTANTS } from "@/lib/constants";
import { handleError, calculatePercentageDifference } from "@/lib/utils";
import { AddMeetingFormSchema } from "@/models/addMeetingForm.schema";
import type {
  AppliedJobOption,
  DeveloperOption,
  Meeting,
  MeetingJobPrefill,
  MeetingResumeOption,
} from "@/models/meeting.model";
import { UNASSIGNED_DEVELOPER } from "@/models/meeting.model";
import { resolveJobOwnerId } from "@/actions/job.actions";
import { requireSubjectUserId, resolveScopedUserId } from "@/lib/admin-scope";
import { isAllUsersScope } from "@/lib/admin-scope.constants";
import { canAccessAssignedMeetings } from "@/lib/user-roles";
import { getCurrentUser, getViewerContext } from "@/utils/user.utils";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { addDays } from "date-fns";

import { buildResumeDownloadUrl } from "@/lib/resume-file.utils";
import { getSalaryRangeLabel } from "@/lib/data/salaryRangeData";

const meetingInclude = {
  job: { select: { jid: true } },
  assignedDeveloper: { select: { id: true, name: true } },
} as const;

function mapMeeting(meeting: {
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
  job?: { jid: number };
  user?: { id: string; name: string };
  assignedDeveloper?: { id: string; name: string } | null;
}): Meeting {
  const { job, user, assignedDeveloper, ...rest } = meeting;
  return {
    ...rest,
    User: user,
    AssignedDeveloper: assignedDeveloper ?? undefined,
    jobJid: job?.jid,
  };
}

async function getMeetingAccessRecord(meetingId: string) {
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId },
    select: {
      userId: true,
      assignedDeveloperId: true,
    },
  });

  if (!meeting) {
    throw new Error("Meeting not found");
  }

  return meeting;
}

async function assertMeetingAccess(
  meetingId: string,
  subjectUserId?: string,
) {
  const viewer = await getViewerContext();
  if (!viewer) {
    throw new Error("Not authenticated");
  }

  const meeting = await getMeetingAccessRecord(meetingId);

  if (viewer.role === UserRole.ADMIN) {
    if (subjectUserId?.trim() && !isAllUsersScope(subjectUserId)) {
      const ownerId = await resolveScopedUserId({
        viewerId: viewer.id,
        viewerRole: viewer.role,
        subjectUserId,
      });
      if (meeting.userId !== ownerId) {
        throw new Error("Meeting not found");
      }
    }
    return meeting;
  }

  if (
    viewer.role === UserRole.DEVELOPER &&
    meeting.assignedDeveloperId === viewer.id
  ) {
    return meeting;
  }

  if (meeting.userId === viewer.id) {
    return meeting;
  }

  throw new Error("Meeting not found");
}

export async function resolveMeetingOwnerId(
  meetingId: string,
  subjectUserId?: string,
): Promise<string> {
  const meeting = await assertMeetingAccess(meetingId, subjectUserId);
  return meeting.userId;
}

async function resolveAssignedDeveloperId(
  assignedDeveloperId?: string | null,
): Promise<string | null> {
  const viewer = await getViewerContext();
  if (!viewer) {
    throw new Error("Not authenticated");
  }

  if (viewer.role !== UserRole.ADMIN) {
    return null;
  }

  const normalized =
    !assignedDeveloperId || assignedDeveloperId === UNASSIGNED_DEVELOPER
      ? null
      : assignedDeveloperId;

  if (!normalized) {
    return null;
  }

  const developer = await prisma.user.findFirst({
    where: { id: normalized, role: UserRole.DEVELOPER },
    select: { id: true },
  });

  if (!developer) {
    throw new Error("Selected developer not found");
  }

  return developer.id;
}

function formToMeetingData(
  data: z.infer<typeof AddMeetingFormSchema>,
  assignedDeveloperId?: string | null,
) {
  return {
    jobId: data.jobId,
    positionRole: data.positionRole.trim(),
    accountName: data.accountName?.trim() ?? "",
    startTime: data.startDateTime,
    endTime: data.endDateTime,
    timeZone: data.timeZone,
    companyName: data.companyName.trim(),
    meetingLink: data.meetingLink?.trim() || null,
    interviewStep: data.interviewStep,
    meetingType: data.meetingType,
    status: data.status,
    area: data.area || null,
    address: data.address?.trim() || null,
    dob: data.dob ?? null,
    resumeUrl: data.resumeUrl?.trim() || null,
    salaryExpectation: data.salaryExpectation?.trim() || null,
    jobDescription: data.jobDescription?.trim() || null,
    ...(assignedDeveloperId !== undefined
      ? { assignedDeveloperId }
      : {}),
  };
}

function buildMeetingSearchFilter(term: string) {
  return [
    { positionRole: { contains: term } },
    { accountName: { contains: term } },
    { companyName: { contains: term } },
    { meetingLink: { contains: term } },
    { address: { contains: term } },
    { salaryExpectation: { contains: term } },
    { jobDescription: { contains: term } },
  ];
}

export const listDevelopersForMeeting = async (): Promise<any | undefined> => {
  try {
    const viewer = await getViewerContext();
    if (!viewer) {
      throw new Error("Not authenticated");
    }
    if (viewer.role !== UserRole.ADMIN) {
      throw new Error("Forbidden");
    }

    const developers = await prisma.user.findMany({
      where: { role: UserRole.DEVELOPER },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });

    const data: DeveloperOption[] = developers.map((developer) => ({
      id: developer.id,
      label: developer.name,
      value: developer.name,
    }));

    return { success: true, data };
  } catch (error) {
    return handleError(error, "Failed to fetch developers.");
  }
};

export const getAssignedMeetingsList = async (
  page: number = 1,
  limit: number = APP_CONSTANTS.RECORDS_PER_PAGE,
  search?: string,
): Promise<any | undefined> => {
  try {
    const viewer = await getViewerContext();
    if (!viewer) {
      throw new Error("Not authenticated");
    }
    if (!canAccessAssignedMeetings(viewer.role)) {
      throw new Error("Forbidden");
    }

    const offset = (page - 1) * limit;
    const whereClause: Record<string, unknown> = {
      assignedDeveloperId: { not: null },
    };

    if (viewer.role === UserRole.DEVELOPER) {
      whereClause.assignedDeveloperId = viewer.id;
    }

    if (search?.trim()) {
      whereClause.OR = buildMeetingSearchFilter(search.trim());
    }

    const include = {
      ...meetingInclude,
      ...(viewer.role === UserRole.ADMIN
        ? { user: { select: { id: true, name: true } } }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.meeting.findMany({
        where: whereClause,
        orderBy: [{ startTime: "desc" }, { mid: "desc" }],
        skip: offset,
        take: limit,
        include,
      }),
      prisma.meeting.count({ where: whereClause }),
    ]);

    return {
      success: true,
      data: rows.map(mapMeeting),
      total,
    };
  } catch (error) {
    return handleError(error, "Failed to fetch assigned meetings.");
  }
};

export const getAssignedMeetingsForPeriod = async (
  daysAgo: number,
): Promise<{ count: number; trend: number }> => {
  try {
    const viewer = await getViewerContext();
    if (!viewer || viewer.role !== UserRole.DEVELOPER) {
      return { count: 0, trend: 0 };
    }

    const now = new Date();
    const periodEnd = addDays(now, daysAgo);
    const previousPeriodEnd = addDays(now, daysAgo * 2);
    const baseWhere = { assignedDeveloperId: viewer.id };

    const [count, countPrevious] = await prisma.$transaction([
      prisma.meeting.count({
        where: {
          ...baseWhere,
          startTime: {
            gte: now,
            lt: periodEnd,
          },
        },
      }),
      prisma.meeting.count({
        where: {
          ...baseWhere,
          startTime: {
            gte: periodEnd,
            lt: previousPeriodEnd,
          },
        },
      }),
    ]);

    const difference = Math.abs(countPrevious - count);
    const trend = calculatePercentageDifference(difference, count) ?? 0;
    return { count, trend };
  } catch (error) {
    const msg = "Failed to count assigned meetings.";
    console.error(msg, error);
    throw new Error(msg);
  }
};

export const getTotalAssignedMeetingsForDeveloper = async (): Promise<number> => {
  try {
    const viewer = await getViewerContext();
    if (!viewer || viewer.role !== UserRole.DEVELOPER) {
      return 0;
    }

    return prisma.meeting.count({
      where: { assignedDeveloperId: viewer.id },
    });
  } catch (error) {
    const msg = "Failed to count assigned meetings.";
    console.error(msg, error);
    throw new Error(msg);
  }
};

export const getMeetingsList = async (
  page: number = 1,
  limit: number = APP_CONSTANTS.RECORDS_PER_PAGE,
  search?: string,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const viewer = await getViewerContext();
    if (!viewer) {
      throw new Error("Not authenticated");
    }

    const isAllUsers =
      viewer.role === "ADMIN" && isAllUsersScope(subjectUserId);
    const offset = (page - 1) * limit;
    const whereClause: Record<string, unknown> = {};

    if (!isAllUsers) {
      whereClause.userId = await resolveScopedUserId({
        viewerId: viewer.id,
        viewerRole: viewer.role,
        subjectUserId,
      });
    }

    if (search?.trim()) {
      whereClause.OR = buildMeetingSearchFilter(search.trim());
    }

    const [rows, total] = await Promise.all([
      prisma.meeting.findMany({
        where: whereClause,
        orderBy: [{ startTime: "desc" }, { mid: "desc" }],
        skip: offset,
        take: limit,
        include: {
          ...meetingInclude,
          ...(isAllUsers
            ? { user: { select: { id: true, name: true } } }
            : {}),
        },
      }),
      prisma.meeting.count({ where: whereClause }),
    ]);

    return {
      success: true,
      data: rows.map(mapMeeting),
      total,
    };
  } catch (error) {
    return handleError(error, "Failed to fetch meetings list.");
  }
};

export const getMeetingById = async (
  meetingId: string,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    await resolveMeetingOwnerId(meetingId, subjectUserId);

    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId },
      include: meetingInclude,
    });

    if (!meeting) {
      throw new Error("Meeting not found");
    }

    return { success: true, data: mapMeeting(meeting) };
  } catch (error) {
    return handleError(error, "Failed to fetch meeting.");
  }
};

function mapJobResumeToOption(resume: {
  id: string;
  title: string;
  File: { fileName: string; filePath: string } | null;
}): MeetingResumeOption | null {
  if (!resume.File?.filePath) return null;

  return {
    id: resume.id,
    label: resume.File.fileName
      ? `${resume.title} (${resume.File.fileName})`
      : resume.title,
    url: buildResumeDownloadUrl(resume.File.filePath),
  };
}

export const getMeetingJobResumeOptions = async (
  jobId: string,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    if (!jobId) {
      return { success: true, data: [] };
    }

    const ownerId = await resolveJobOwnerId(jobId, subjectUserId);

    const job = await prisma.job.findFirst({
      where: { id: jobId, userId: ownerId, applied: true },
      include: {
        Resume: { include: { File: true } },
      },
    });

    if (!job) {
      throw new Error("Applied job not found");
    }

    const option = job.Resume ? mapJobResumeToOption(job.Resume) : null;

    return { success: true, data: option ? [option] : [] };
  } catch (error) {
    return handleError(error, "Failed to fetch job resume.");
  }
};

export const getAppliedJobsForMeeting = async (
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);

    const jobs = await prisma.job.findMany({
      where: { userId: ownerId, applied: true },
      select: {
        id: true,
        JobTitle: { select: { label: true } },
        Company: { select: { label: true } },
        Location: { select: { label: true } },
      },
      orderBy: { appliedDate: "desc" },
    });

    const data: AppliedJobOption[] = jobs.map((job) => ({
      id: job.id,
      label: `${job.JobTitle.label} – ${job.Company.label}${
        job.Location?.label ? ` (${job.Location.label})` : ""
      }`,
    }));

    return { success: true, data };
  } catch (error) {
    return handleError(error, "Failed to fetch applied jobs.");
  }
};

export const getMeetingJobPrefill = async (
  jobId: string,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await resolveJobOwnerId(jobId, subjectUserId);

    const job = await prisma.job.findFirst({
      where: { id: jobId, userId: ownerId, applied: true },
      include: {
        JobTitle: true,
        Company: true,
        Location: true,
        Resume: { include: { File: true } },
      },
    });

    if (!job) {
      throw new Error("Applied job not found");
    }

    const data: MeetingJobPrefill = {
      positionRole: job.JobTitle.label,
      companyName: job.Company.label,
      address: job.Location?.label ?? "",
      salaryExpectation: getSalaryRangeLabel(job.salaryRange),
      resumeUrl: job.Resume?.File?.filePath
        ? buildResumeDownloadUrl(job.Resume.File.filePath)
        : "",
      jobDescription: job.description ?? "",
    };

    return { success: true, data };
  } catch (error) {
    return handleError(error, "Failed to load job details for meeting.");
  }
};

export const createMeeting = async (
  data: z.infer<typeof AddMeetingFormSchema>,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const validated = AddMeetingFormSchema.parse(data);
    const ownerId = await requireSubjectUserId(subjectUserId);

    await resolveJobOwnerId(validated.jobId, subjectUserId);

    const meeting = await prisma.meeting.create({
      data: {
        ...formToMeetingData(validated),
        userId: ownerId,
      },
    });

    return { success: true, data: mapMeeting(meeting) };
  } catch (error) {
    return handleError(error, "Failed to create meeting.");
  }
};

export const updateMeeting = async (
  data: z.infer<typeof AddMeetingFormSchema>,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const validated = AddMeetingFormSchema.parse(data);
    if (!validated.id) {
      throw new Error("Meeting ID is required for update");
    }

    const viewer = await getViewerContext();
    if (!viewer) {
      throw new Error("Not authenticated");
    }

    const existingMeeting = await assertMeetingAccess(validated.id, subjectUserId);

    if (
      viewer.role === UserRole.DEVELOPER &&
      existingMeeting.userId !== viewer.id
    ) {
      throw new Error("Forbidden");
    }

    await resolveJobOwnerId(validated.jobId, subjectUserId);

    const assignedDeveloperId =
      viewer.role === UserRole.ADMIN
        ? await resolveAssignedDeveloperId(validated.assignedDeveloperId)
        : undefined;

    const meeting = await prisma.meeting.update({
      where: { id: validated.id },
      data: formToMeetingData(validated, assignedDeveloperId),
    });

    return { success: true, data: mapMeeting(meeting) };
  } catch (error) {
    return handleError(error, "Failed to update meeting.");
  }
};

export const deleteMeetingById = async (
  meetingId: string,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const viewer = await getViewerContext();
    if (!viewer) {
      throw new Error("Not authenticated");
    }

    const meeting = await assertMeetingAccess(meetingId, subjectUserId);

    if (
      viewer.role !== UserRole.ADMIN &&
      meeting.userId !== viewer.id
    ) {
      throw new Error("Forbidden");
    }

    await prisma.meeting.delete({
      where: { id: meetingId },
    });

    return { success: true };
  } catch (error) {
    return handleError(error, "Failed to delete meeting.");
  }
};
