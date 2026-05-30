"use server";
import prisma from "@/lib/db";
import { handleError } from "@/lib/utils";
import { getCurrentUser } from "@/utils/user.utils";
import { APP_CONSTANTS } from "@/lib/constants";

async function fetchAllJobTitles() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  const titles = await prisma.jobTitle.findMany({
    orderBy: { label: "asc" },
  });

  const byValue = new Map<string, (typeof titles)[number]>();
  for (const title of titles) {
    const existing = byValue.get(title.value);
    if (!existing || title.createdBy === user.id) {
      byValue.set(title.value, title);
    }
  }

  return Array.from(byValue.values());
}

export const getAllJobTitles = async (): Promise<any | undefined> => {
  try {
    return await fetchAllJobTitles();
  } catch (error) {
    const msg = "Failed to fetch job title list. ";
    return handleError(error, msg);
  }
};

export const getJobTitleList = async (
  page: number = 1,
  limit: number = APP_CONSTANTS.RECORDS_PER_PAGE,
  countBy?: string
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.jobTitle.findMany({
        where: {
          createdBy: user.id,
        },
        skip,
        take: limit,
        ...(countBy
          ? {
              select: {
                id: true,
                label: true,
                value: true,
                _count: {
                  select: {
                    jobs: {
                      where: {
                        applied: true,
                      },
                    },
                  },
                },
              },
            }
          : {}),
        orderBy: {
          jobs: {
            _count: "desc",
          },
        },
      }),
      prisma.jobTitle.count({
        where: {
          createdBy: user.id,
        },
      }),
    ]);
    return { data, total };
  } catch (error) {
    const msg = "Failed to fetch job title list. ";
    return handleError(error, msg);
  }
};

export const createJobTitle = async (
  label: string,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const trimmedLabel = label.trim();
    const value = trimmedLabel.toLowerCase();

    if (!value) {
      throw new Error("Please provide job title");
    }

    const existingForUser = await prisma.jobTitle.findFirst({
      where: { value, createdBy: user.id },
    });

    if (existingForUser) {
      const updated = await prisma.jobTitle.update({
        where: { id: existingForUser.id },
        data: { label: trimmedLabel },
      });
      return { success: true, data: updated };
    }

    const sharedTitle = await prisma.jobTitle.findFirst({
      where: { value },
    });

    if (sharedTitle) {
      return { success: true, data: sharedTitle };
    }

    const created = await prisma.jobTitle.create({
      data: { label: trimmedLabel, value, createdBy: user.id },
    });

    return { success: true, data: created };
  } catch (error) {
    const msg = "Failed to create job title. ";
    return handleError(error, msg);
  }
};

export const deleteJobTitleById = async (
  jobTitleId: string
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const experiences = await prisma.workExperience.count({
      where: {
        jobTitleId,
      },
    });
    if (experiences > 0) {
      throw new Error(
        `Job title cannot be deleted due to its use in experience section of one of the resume! `
      );
    }
    const jobs = await prisma.job.count({
      where: {
        jobTitleId,
      },
    });

    if (jobs > 0) {
      throw new Error(
        `Job title cannot be deleted due to ${jobs} number of associated jobs! `
      );
    }

    const res = await prisma.jobTitle.delete({
      where: {
        id: jobTitleId,
        createdBy: user.id,
      },
    });
    return { res, success: true };
  } catch (error) {
    const msg = "Failed to delete job title.";
    return handleError(error, msg);
  }
};
