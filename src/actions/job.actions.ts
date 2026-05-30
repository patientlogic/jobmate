"use server";
import prisma from "@/lib/db";
import { handleError } from "@/lib/utils";
import { AddJobFormSchema } from "@/models/addJobForm.schema";
import { JOB_TYPES, JobStatus } from "@/models/job.model";
import { getCurrentUser, getViewerContext } from "@/utils/user.utils";
import { requireSubjectUserId, resolveScopedUserId } from "@/lib/admin-scope";
import { APP_CONSTANTS } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const getStatusList = async (): Promise<any | undefined> => {
  try {
    const statuses = await prisma.jobStatus.findMany();
    return statuses;
  } catch (error) {
    const msg = "Failed to fetch status list. ";
    return handleError(error, msg);
  }
};

export const getJobSourceList = async (): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }
    const list = await prisma.jobSource.findMany({
      where: {
        createdBy: user.id,
      },
    });
    return list;
  } catch (error) {
    const msg = "Failed to fetch job source list. ";
    return handleError(error, msg);
  }
};

export async function resolveJobOwnerId(
  jobId: string,
  subjectUserId?: string,
): Promise<string> {
  const viewer = await getViewerContext();
  if (!viewer) {
    throw new Error("Not authenticated");
  }

  if (subjectUserId?.trim()) {
    const ownerId = await requireSubjectUserId(subjectUserId);
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId: ownerId },
      select: { userId: true },
    });
    if (!job) {
      throw new Error("Job not found");
    }
    return ownerId;
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId },
    select: { userId: true },
  });
  if (!job) {
    throw new Error("Job not found");
  }

  if (viewer.role === "ADMIN" || job.userId === viewer.id) {
    return job.userId;
  }

  throw new Error("Forbidden");
}

export const getJobsList = async (
  page: number = 1,
  limit: number = APP_CONSTANTS.RECORDS_PER_PAGE,
  filter?: string,
  search?: string,
  companyValue?: string,
  appliedOnly?: boolean,
  titleValue?: string,
  locationValue?: string,
  sourceValue?: string,
  bidderSubjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const viewer = await getViewerContext();

    if (!viewer) {
      throw new Error("Not authenticated");
    }

    const ownerId = await resolveScopedUserId({
      viewerId: viewer.id,
      viewerRole: viewer.role,
      subjectUserId: bidderSubjectUserId,
    });
    const skip = (page - 1) * limit;

    const filterBy = filter
      ? filter === Object.keys(JOB_TYPES)[1]
        ? {
            jobType: filter,
          }
        : {
            Status: {
              value: filter,
            },
          }
      : {};

    const whereClause: any = {
      userId: ownerId,
      ...filterBy,
    };

    if (companyValue) {
      whereClause.Company = { value: companyValue };
    }

    if (titleValue) {
      whereClause.JobTitle = { value: titleValue };
    }

    if (locationValue) {
      whereClause.Location = { value: locationValue };
    }

    if (sourceValue) {
      whereClause.JobSource = { value: sourceValue };
    }

    if (appliedOnly) {
      whereClause.applied = true;
    }

    if (search) {
      const searchConditions: Record<string, any>[] = [];
      if (!titleValue) {
        searchConditions.push({ JobTitle: { label: { contains: search } } });
      }
      if (!companyValue) {
        searchConditions.push({ Company: { label: { contains: search } } });
      }
      if (!locationValue) {
        searchConditions.push({ Location: { label: { contains: search } } });
      }
      searchConditions.push(
        { description: { contains: search } },
      );
      whereClause.OR = searchConditions;
    }

    const [data, total] = await Promise.all([
      prisma.job.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          JobSource: true,
          JobTitle: true,
          jobType: true,
          Company: true,
          Status: true,
          Location: true,
          dueDate: true,
          appliedDate: true,
          description: false,
          Resume: true,
          CoverLetter: true,
          matchScore: true,
          _count: { select: { Notes: true } },
        },
        orderBy: {
          createdAt: "desc",
          // appliedDate: "desc",
        },
      }),
      prisma.job.count({
        where: whereClause,
      }),
    ]);
    return { success: true, data, total };
  } catch (error) {
    const msg = "Failed to fetch jobs list. ";
    return handleError(error, msg);
  }
};

export async function* getJobsIterator(
  filter?: string,
  pageSize = 200,
  subjectUserId?: string,
) {
  const ownerId = await requireSubjectUserId(subjectUserId);
  let page = 1;

  while (true) {
    const skip = (page - 1) * pageSize;
    const filterBy = filter
      ? filter === Object.keys(JOB_TYPES)[1]
        ? { status: filter }
        : { type: filter }
      : {};

    const chunk = await prisma.job.findMany({
      where: {
        userId: ownerId,
        ...filterBy,
      },
      select: {
        id: true,
        createdAt: true,
        JobSource: true,
        JobTitle: true,
        jobType: true,
        Company: true,
        Status: true,
        Location: true,
        dueDate: true,
        applied: true,
        appliedDate: true,
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    });

    if (!chunk.length) {
      break;
    }

    if (!chunk.length) {
      break;
    }

    yield chunk;
    page++;
  }
}

export const getJobDetails = async (
  jobId: string,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    if (!jobId) {
      throw new Error("Please provide job id");
    }
    const viewer = await getViewerContext();

    if (!viewer) {
      throw new Error("Not authenticated");
    }

    const whereClause = subjectUserId?.trim()
      ? {
          id: jobId,
          userId: await resolveScopedUserId({
            viewerId: viewer.id,
            viewerRole: viewer.role,
            subjectUserId,
          }),
        }
      : viewer.role === "ADMIN"
        ? { id: jobId }
        : { id: jobId, userId: viewer.id };

    const job = await prisma.job.findFirst({
      where: whereClause,
      include: {
        JobSource: true,
        JobTitle: true,
        Company: true,
        Status: true,
        Location: true,
        Resume: {
          include: {
            File: true,
          },
        },
        CoverLetter: true,
        tags: true,
      },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    return { job, success: true };
  } catch (error) {
    const msg = "Failed to fetch job details. ";
    return handleError(error, msg);
  }
};

export const createLocation = async (
  label: string,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const value = label.trim().toLowerCase();

    if (!value) {
      throw new Error("Please provide location name");
    }

    const existing = await prisma.location.findFirst({
      where: { value, createdBy: user.id },
    });
    if (existing) {
      return { data: existing, success: true };
    }

    const location = await prisma.location.create({
      data: { label, value, createdBy: user.id },
    });

    return { data: location, success: true };
  } catch (error) {
    const msg = "Failed to create job location. ";
    return handleError(error, msg);
  }
};

export const createJobSource = async (
  label: string,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const value = label.trim().toLowerCase();

    if (!value) {
      throw new Error("Please provide job source name");
    }

    const existing = await prisma.jobSource.findFirst({
      where: { value, createdBy: user.id },
    });
    if (existing) {
      return { data: existing, success: true };
    }

    const jobSource = await prisma.jobSource.create({
      data: { label, value, createdBy: user.id },
    });

    return { data: jobSource, success: true };
  } catch (error) {
    const msg = "Failed to create job source. ";
    return handleError(error, msg);
  }
};

export const addJob = async (
  data: z.infer<typeof AddJobFormSchema>,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);

    const {
      title,
      company,
      location,
      type,
      status,
      source,
      salaryRange,
      dueDate,
      dateApplied,
      jobDescription,
      jobUrl,
      applied,
      resume,
      coverLetter,
      tags,
    } = data;

    const tagIds = tags ?? [];

    const job = await prisma.job.create({
      data: {
        jobTitleId: title,
        companyId: company,
        locationId: location,
        statusId: status,
        jobSourceId: source,
        salaryRange: salaryRange,
        createdAt: new Date(),
        dueDate: dueDate,
        appliedDate: dateApplied,
        description: jobDescription,
        jobType: type,
        userId: ownerId,
        jobUrl,
        applied,
        resumeId: resume,
        coverLetterId: coverLetter,
        ...(tagIds.length > 0
          ? { tags: { connect: tagIds.map((id) => ({ id })) } }
          : {}),
      },
    });
    return { job, success: true };
  } catch (error) {
    const msg = "Failed to create job. ";
    return handleError(error, msg);
  }
};

export const updateJob = async (
  data: z.infer<typeof AddJobFormSchema>,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    if (!data.id) {
      throw new Error("Job id is required");
    }
    const ownerId = await requireSubjectUserId(subjectUserId);

    const {
      id,
      title,
      company,
      location,
      type,
      status,
      source,
      salaryRange,
      dueDate,
      dateApplied,
      jobDescription,
      jobUrl,
      applied,
      resume,
      coverLetter,
      tags,
    } = data;

    const tagIds = tags ?? [];

    const job = await prisma.job.update({
      where: {
        id,
        userId: ownerId,
      },
      data: {
        jobTitleId: title,
        companyId: company,
        locationId: location,
        statusId: status,
        jobSourceId: source,
        salaryRange: salaryRange,
        createdAt: new Date(),
        dueDate: dueDate,
        appliedDate: dateApplied,
        description: jobDescription,
        jobType: type,
        jobUrl,
        applied,
        resumeId: resume,
        coverLetterId: coverLetter,
        tags: { set: tagIds.map((id) => ({ id })) },
      },
    });
    // revalidatePath("/dashboard/myjobs", "page");
    return { job, success: true };
  } catch (error) {
    const msg = "Failed to update job. ";
    return handleError(error, msg);
  }
};

export const updateJobStatus = async (
  jobId: string,
  status: JobStatus,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await resolveJobOwnerId(jobId, subjectUserId);
    const dataToUpdate = () => {
      switch (status.value) {
        case "applied":
          return {
            statusId: status.id,
            applied: true,
            appliedDate: new Date(),
          };
        case "interview":
          return {
            statusId: status.id,
            applied: true,
          };
        default:
          return {
            statusId: status.id,
          };
      }
    };

    const job = await prisma.job.update({
      where: {
        id: jobId,
        userId: ownerId,
      },
      data: dataToUpdate(),
    });
    return { job, success: true };
  } catch (error) {
    const msg = "Failed to update job status.";
    return handleError(error, msg);
  }
};

export const saveJobMatchResult = async (
  jobId: string,
  matchScore: number,
  matchData: string,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await resolveJobOwnerId(jobId, subjectUserId);

    await prisma.job.update({
      where: { id: jobId, userId: ownerId },
      data: { matchScore, matchData },
    });

    return { success: true };
  } catch (error) {
    const msg = "Failed to save match result.";
    return handleError(error, msg);
  }
};

export const deleteJobById = async (
  jobId: string,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await resolveJobOwnerId(jobId, subjectUserId);

    const res = await prisma.job.delete({
      where: {
        id: jobId,
        userId: ownerId,
      },
    });
    return { res, success: true };
  } catch (error) {
    const msg = "Failed to delete job.";
    return handleError(error, msg);
  }
};
