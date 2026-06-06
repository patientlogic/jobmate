"use server";

import prisma from "@/lib/db";
import { APP_CONSTANTS } from "@/lib/constants";
import { handleError } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { getViewerContext } from "@/utils/user.utils";
import { endOfDay, startOfDay } from "date-fns";

export type JobBidderSummary = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActivated: boolean;
  createdAt: Date;
  jobsTotal: number;
  jobsAppliedCount: number;
};

function assertSiteAdmin(viewerRole: UserRole): void {
  if (viewerRole !== UserRole.ADMIN) {
    throw new Error("Forbidden");
  }
}

type JobUserCount = {
  userId: string;
  _count: { _all: number };
};

export async function listJobBidders(): Promise<JobBidderSummary[]> {
  const viewer = await getViewerContext();
  if (!viewer) {
    throw new Error("Not authenticated");
  }
  assertSiteAdmin(viewer.role);

  const appliedByUser = await prisma.job.groupBy({
    by: ["userId"],
    where: { applied: true },
    _count: { _all: true },
  });
  const appliedMap = new Map(
    (appliedByUser as JobUserCount[]).map((r) => [r.userId, r._count._all]),
  );

  const totalsByUser = await prisma.job.groupBy({
    by: ["userId"],
    _count: { _all: true },
  });
  const totalMap = new Map(
    (totalsByUser as JobUserCount[]).map((r) => [r.userId, r._count._all]),
  );

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActivated: true,
      createdAt: true,
    },
  });

  return users.map((u) => ({
    ...u,
    jobsTotal: totalMap.get(u.id) ?? 0,
    jobsAppliedCount: appliedMap.get(u.id) ?? 0,
  }));
}

export async function getAdminViewerId(): Promise<string> {
  const viewer = await getViewerContext();
  if (!viewer) {
    throw new Error("Not authenticated");
  }
  assertSiteAdmin(viewer.role);
  return viewer.id;
}

type PrismaTransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

async function deleteResumeTree(
  tx: PrismaTransactionClient,
  resumeId: string,
): Promise<void> {
  await tx.otherSection.deleteMany({
    where: { ResumeSection: { resumeId } },
  });
  await tx.contactInfo.deleteMany({ where: { resumeId } });
  await tx.summary.deleteMany({
    where: { ResumeSection: { resumeId } },
  });
  await tx.workExperience.deleteMany({
    where: { ResumeSection: { resumeId } },
  });
  await tx.education.deleteMany({
    where: { ResumeSection: { resumeId } },
  });
  await tx.licenseOrCertification.deleteMany({
    where: { ResumeSection: { resumeId } },
  });
  await tx.resumeSection.deleteMany({ where: { resumeId } });

  const resume = await tx.resume.findUnique({
    where: { id: resumeId },
    select: { FileId: true },
  });

  await tx.resume.delete({ where: { id: resumeId } });

  if (resume?.FileId) {
    await tx.file.delete({ where: { id: resume.FileId } });
  }
}

export async function deleteUserById(
  userId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const viewer = await getViewerContext();
    if (!viewer) {
      throw new Error("Not authenticated");
    }
    assertSiteAdmin(viewer.role);

    if (viewer.id === userId) {
      throw new Error("You cannot delete your own account");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role === UserRole.ADMIN) {
      throw new Error("Admin accounts cannot be deleted");
    }

    await prisma.$transaction(async (tx) => {
      const jobIds = (
        await tx.job.findMany({ where: { userId }, select: { id: true } })
      ).map((job) => job.id);

      await tx.meeting.updateMany({
        where: { assignedDeveloperId: userId },
        data: { assignedDeveloperId: null },
      });

      await tx.meetingNote.deleteMany({
        where: {
          OR: [{ userId }, { meeting: { userId } }],
        },
      });
      await tx.meeting.deleteMany({ where: { userId } });

      if (jobIds.length > 0) {
        const interviewIds = (
          await tx.interview.findMany({
            where: { jobId: { in: jobIds } },
            select: { id: true },
          })
        ).map((interview) => interview.id);

        if (interviewIds.length > 0) {
          await tx.contact.deleteMany({
            where: { interviewId: { in: interviewIds } },
          });
          await tx.interview.deleteMany({
            where: { id: { in: interviewIds } },
          });
        }

        await tx.note.deleteMany({ where: { jobId: { in: jobIds } } });

        for (const jobId of jobIds) {
          await tx.job.update({
            where: { id: jobId },
            data: { tags: { set: [] } },
          });
        }

        await tx.job.deleteMany({ where: { userId } });
      }

      await tx.note.deleteMany({ where: { userId } });
      await tx.activity.deleteMany({ where: { userId } });
      await tx.task.deleteMany({ where: { userId } });
      await tx.automation.deleteMany({ where: { userId } });

      const questions = await tx.question.findMany({
        where: { createdBy: userId },
        select: { id: true },
      });

      for (const question of questions) {
        await tx.question.update({
          where: { id: question.id },
          data: { tags: { set: [] } },
        });
      }

      await tx.question.deleteMany({ where: { createdBy: userId } });
      await tx.tag.deleteMany({ where: { createdBy: userId } });
      await tx.activityType.deleteMany({ where: { createdBy: userId } });
      await tx.contact.deleteMany({ where: { createdBy: userId } });

      const profiles = await tx.profile.findMany({
        where: { userId },
        select: {
          id: true,
          resumes: { select: { id: true } },
        },
      });

      for (const profile of profiles) {
        for (const resume of profile.resumes) {
          await deleteResumeTree(tx, resume.id);
        }

        await tx.coverLetter.deleteMany({ where: { profileId: profile.id } });
        await tx.siteProfile.deleteMany({ where: { profileId: profile.id } });
        await tx.profile.delete({ where: { id: profile.id } });
      }

      await tx.jobTitle.deleteMany({ where: { createdBy: userId } });
      await tx.location.deleteMany({ where: { createdBy: userId } });
      await tx.company.deleteMany({ where: { createdBy: userId } });
      await tx.jobSource.deleteMany({ where: { createdBy: userId } });
      await tx.apiKey.deleteMany({ where: { userId } });
      await tx.userSettings.deleteMany({ where: { userId } });

      await tx.user.delete({ where: { id: userId } });
    });

    return { success: true };
  } catch (error) {
    return handleError(error, "Failed to delete user.");
  }
}

export async function setUserActivated(
  userId: string,
  isActivated: boolean,
): Promise<{ success: boolean; message?: string }> {
  try {
    const viewer = await getViewerContext();
    if (!viewer) {
      throw new Error("Not authenticated");
    }
    assertSiteAdmin(viewer.role);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role === UserRole.ADMIN) {
      throw new Error("Admin accounts cannot be deactivated");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActivated },
    });

    return { success: true };
  } catch (error) {
    return handleError(error, "Failed to update user activation.");
  }
}

export async function getBidderProfileForAdmin(userId: string) {
  const viewer = await getViewerContext();
  if (!viewer) {
    throw new Error("Not authenticated");
  }
  assertSiteAdmin(viewer.role);

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

export type AdminAppliedJob = {
  id: string;
  userId: string;
  jobSeekerName: string;
  JobSource: {
    id: string;
    label: string;
    value: string;
  } | null;
  JobTitle: {
    id: string;
    label: string;
    value: string;
  };
  jobType: string;
  Company: {
    id: string;
    label: string;
    value: string;
    logoUrl: string | null;
  };
  Status: {
    id: string;
    label: string;
    value: string;
  };
  Location: {
    id: string;
    label: string;
    value: string;
  } | null;
  dueDate: Date | null;
  appliedDate: Date | null;
  matchScore: number | null;
  _count: { Notes: number };
};

export type AppliedJobsFilters = {
  jobSeekerId?: string;
  companyValue?: string;
  appliedDate?: string;
};

export async function getAllAppliedJobsList(
  page: number = 1,
  limit: number = APP_CONSTANTS.RECORDS_PER_PAGE,
  search?: string,
  filters?: AppliedJobsFilters,
): Promise<{
  success: boolean;
  data?: AdminAppliedJob[];
  total?: number;
  message?: string;
}> {
  try {
    const viewer = await getViewerContext();
    if (!viewer) {
      throw new Error("Not authenticated");
    }
    assertSiteAdmin(viewer.role);

    const skip = (page - 1) * limit;
    const conditions: Record<string, unknown>[] = [{ applied: true }];

    if (filters?.jobSeekerId) {
      conditions.push({ userId: filters.jobSeekerId });
    }

    if (filters?.companyValue) {
      conditions.push({ Company: { value: filters.companyValue } });
    }

    if (filters?.appliedDate) {
      const date = new Date(filters.appliedDate);
      conditions.push({
        appliedDate: {
          gte: startOfDay(date),
          lte: endOfDay(date),
        },
      });
    }

    if (search?.trim()) {
      conditions.push({
        OR: [
          { JobTitle: { label: { contains: search.trim() } } },
          { Company: { label: { contains: search.trim() } } },
          { Location: { label: { contains: search.trim() } } },
          { description: { contains: search.trim() } },
          { User: { name: { contains: search.trim() } } },
        ],
      });
    }

    const whereClause =
      conditions.length === 1 ? conditions[0] : { AND: conditions };

    const [rows, total] = await Promise.all([
      prisma.job.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          JobSource: true,
          JobTitle: true,
          jobType: true,
          Company: true,
          Status: true,
          Location: true,
          dueDate: true,
          appliedDate: true,
          matchScore: true,
          User: {
            select: {
              name: true,
            },
          },
          _count: { select: { Notes: true } },
        },
        orderBy: {
          appliedDate: "desc",
        },
      }),
      prisma.job.count({
        where: whereClause,
      }),
    ]);

    const data: AdminAppliedJob[] = rows.map((job) => ({
      id: job.id,
      userId: job.userId,
      jobSeekerName: job.User.name,
      JobSource: job.JobSource,
      JobTitle: job.JobTitle,
      jobType: job.jobType,
      Company: job.Company,
      Status: job.Status,
      Location: job.Location,
      dueDate: job.dueDate,
      appliedDate: job.appliedDate,
      matchScore: job.matchScore,
      _count: job._count,
    }));

    return { success: true, data, total };
  } catch (error) {
    const msg = "Failed to fetch applied jobs list.";
    return handleError(error, msg) as {
      success: boolean;
      message: string;
    };
  }
}
