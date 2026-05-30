import { APP_CONSTANTS } from "@/lib/constants";
import prisma from "@/lib/db";
import { resolveScopedUserId } from "@/lib/admin-scope";
import { isAllUsersScope } from "@/lib/admin-scope.constants";
import { calculatePercentageDifference, getLast7Days } from "@/lib/utils";
import { getViewerContext } from "@/utils/user.utils";
import { Prisma } from "@prisma/client";
import { format, parseISO, subDays } from "date-fns";

async function resolveDashboardScope(subjectUserId?: string) {
  const viewer = await getViewerContext();
  if (!viewer) {
    throw new Error("Not authenticated");
  }

  const isAllUsers =
    viewer.role === "ADMIN" && isAllUsersScope(subjectUserId);
  if (isAllUsers) {
    return { isAllUsers: true as const, userId: undefined };
  }

  const userId = await resolveScopedUserId({
    viewerId: viewer.id,
    viewerRole: viewer.role,
    subjectUserId,
  });
  return { isAllUsers: false as const, userId };
}

function userWhere(isAllUsers: boolean, userId?: string) {
  return isAllUsers || !userId ? {} : { userId };
}

export const getJobsAppliedForPeriod = async (
  daysAgo: number,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const { isAllUsers, userId } = await resolveDashboardScope(subjectUserId);
    const startDate1 = subDays(new Date(), daysAgo);
    const startDate2 = subDays(new Date(), daysAgo * 2);
    const endDate = new Date();
    const query = (date: Date): Prisma.JobCountArgs => ({
      where: {
        ...userWhere(isAllUsers, userId),
        applied: true,
        appliedDate: {
          gte: date,
          lt: endDate,
        },
      },
    });

    const [count, count2] = await prisma.$transaction([
      prisma.job.count(query(startDate1)),
      prisma.job.count(query(startDate2)),
    ]);
    const difference = Math.abs(count2 - count);
    const trend = calculatePercentageDifference(difference, count);
    return { count, trend };
  } catch (error) {
    const msg = "Failed to calculate job count";
    console.error(msg, error);
    throw new Error(msg);
  }
};

export const getInterviewsForPeriod = async (
  daysAgo: number,
  subjectUserId?: string,
): Promise<{ count: number; trend: number }> => {
  try {
    const { isAllUsers, userId } = await resolveDashboardScope(subjectUserId);
    const startDate1 = subDays(new Date(), daysAgo);
    const startDate2 = subDays(new Date(), daysAgo * 2);
    const endDate = new Date();
    const query = (date: Date): Prisma.JobCountArgs => ({
      where: {
        ...userWhere(isAllUsers, userId),
        Status: { value: "interview" },
        OR: [
          {
            appliedDate: {
              gte: date,
              lt: endDate,
            },
          },
          {
            appliedDate: null,
            createdAt: {
              gte: date,
              lt: endDate,
            },
          },
        ],
      },
    });

    const [count, count2] = await prisma.$transaction([
      prisma.job.count(query(startDate1)),
      prisma.job.count(query(startDate2)),
    ]);
    const difference = Math.abs(count2 - count);
    const trend = calculatePercentageDifference(difference, count);
    return { count, trend };
  } catch (error) {
    const msg = "Failed to calculate interview count";
    console.error(msg, error);
    throw new Error(msg);
  }
};

export const getRecentJobs = async (
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const { isAllUsers, userId } = await resolveDashboardScope(subjectUserId);
    const list = await prisma.job.findMany({
      where: {
        ...userWhere(isAllUsers, userId),
        applied: true,
      },
      include: {
        JobSource: true,
        JobTitle: true,
        Company: true,
        Status: true,
        Location: true,
        ...(isAllUsers ? { User: { select: { id: true, name: true } } } : {}),
      },
      orderBy: {
        appliedDate: "desc",
      },
      take: APP_CONSTANTS.RECENT_NUM_JOBS_ACTIVITIES,
    });
    return list;
  } catch (error) {
    const msg = "Failed to fetch jobs list. ";
    console.error(msg, error);
    throw new Error(msg);
  }
};

export const getActivityDataForPeriod = async (
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const { isAllUsers, userId } = await resolveDashboardScope(subjectUserId);
    const now = new Date();
    // Use local time for date range to match grouping and getLast7Days
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );
    const sevenDaysAgo = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6,
      0,
      0,
      0,
      0,
    );
    const activities = await prisma.activity.findMany({
      where: {
        ...userWhere(isAllUsers, userId),
        endTime: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
      select: {
        endTime: true,
        duration: true,
        activityType: {
          select: {
            label: true,
          },
        },
      },
      orderBy: {
        endTime: "asc",
      },
    });
    const groupedData = activities.reduce((acc: any, activity: any) => {
      // Use local date for grouping to match user's perception
      const activityDate = new Date(activity.endTime);
      const day = format(activityDate, "yyyy-MM-dd");
      const activityTypeLabel = activity.activityType?.label || "Unknown";

      if (!acc[day]) {
        acc[day] = {};
      }

      const durationInHours = (activity.duration || 0) / 60;
      acc[day][activityTypeLabel] =
        (acc[day][activityTypeLabel] || 0) + durationInHours;

      return acc;
    }, {});
    const last7Days = getLast7Days("yyyy-MM-dd");
    const result = last7Days.map((dateStr) => ({
      day: format(parseISO(dateStr), "EEE, MMM d"),
      ...groupedData[dateStr],
    }));
    return result;
  } catch (error) {
    const msg = "Failed to fetch activities data.";
    console.error(msg, error);
    throw new Error(msg);
  }
};

export const getJobsActivityForPeriod = async (
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const { isAllUsers, userId } = await resolveDashboardScope(subjectUserId);
    const now = new Date();
    // Use local time for date range to match grouping and getLast7Days
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );
    const sevenDaysAgo = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6,
      0,
      0,
      0,
      0,
    );
    const jobData = await prisma.job.groupBy({
      by: "appliedDate",
      _count: {
        _all: true,
      },
      where: {
        ...userWhere(isAllUsers, userId),
        applied: true,
        appliedDate: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
      orderBy: {
        appliedDate: "asc",
      },
    });
    // Reduce to a format that groups by unique date (YYYY-MM-DD) using local time
    const groupedPosts = jobData.reduce((acc: any, post: any) => {
      if (!post.appliedDate) return acc;
      const date = format(new Date(post.appliedDate), "yyyy-MM-dd");
      acc[date] = (acc[date] || 0) + post._count._all;
      return acc;
    }, {});
    // Get the last 7 days in local time
    const last7Days = getLast7Days("yyyy-MM-dd");
    // Map to ensure all dates are represented with a count of 0 if necessary
    const result = last7Days.map((dateStr) => ({
      day: format(parseISO(dateStr), "EEE, MMM d"),
      value: groupedPosts[dateStr] || 0,
    }));

    return result;
  } catch (error) {
    const msg = "Failed to fetch jobs list. ";
    console.error(msg, error);
    throw new Error(msg);
  }
};

export const getInterviewJobsForPeriod = async (
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const { isAllUsers, userId } = await resolveDashboardScope(subjectUserId);
    const last7Days = getLast7Days("yyyy-MM-dd");
    const last7DaysSet = new Set(last7Days);

    const jobs = await prisma.job.findMany({
      where: {
        ...userWhere(isAllUsers, userId),
        Status: { value: "interview" },
      },
      select: {
        appliedDate: true,
        createdAt: true,
      },
    });

    const groupedInterviews = jobs.reduce(
      (acc: Record<string, number>, job) => {
        const referenceDate = job.appliedDate ?? job.createdAt;
        const date = format(new Date(referenceDate), "yyyy-MM-dd");
        if (!last7DaysSet.has(date)) return acc;
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {},
    );

    return last7Days.map((dateStr) => ({
      day: format(parseISO(dateStr), "EEE, MMM d"),
      value: groupedInterviews[dateStr] || 0,
    }));
  } catch (error) {
    const msg = "Failed to fetch interview jobs. ";
    console.error(msg, error);
    throw new Error(msg);
  }
};

export interface TopActivityType {
  label: string;
  hours: number;
}

export const getTopActivityTypesByDuration = async (
  daysAgo: number,
  subjectUserId?: string,
): Promise<TopActivityType[]> => {
  try {
    const { isAllUsers, userId } = await resolveDashboardScope(subjectUserId);
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - daysAgo + 1,
      0,
      0,
      0,
      0,
    );

    const activities = await prisma.activity.findMany({
      where: {
        ...userWhere(isAllUsers, userId),
        endTime: {
          gte: startDate,
          lte: today,
        },
      },
      select: {
        duration: true,
        activityType: {
          select: {
            label: true,
          },
        },
      },
    });

    const groupedByType = activities.reduce(
      (acc: Record<string, number>, activity) => {
        const label = activity.activityType?.label || "Unknown";
        const durationInHours = (activity.duration || 0) / 60;
        acc[label] = (acc[label] || 0) + durationInHours;
        return acc;
      },
      {},
    );

    const sorted = Object.entries(groupedByType)
      .map(([label, hours]) => ({ label, hours: Math.round(hours * 10) / 10 }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 3);

    return sorted;
  } catch (error) {
    const msg = "Failed to fetch top activity types";
    console.error(msg, error);
    throw new Error(msg);
  }
};

export const getRecentActivities = async (
  subjectUserId?: string,
) => {
  try {
    const { isAllUsers, userId } = await resolveDashboardScope(subjectUserId);
    const list = await prisma.activity.findMany({
      where: {
        ...userWhere(isAllUsers, userId),
        endTime: { not: null },
      },
      include: {
        activityType: true,
        ...(isAllUsers ? { User: { select: { id: true, name: true } } } : {}),
      },
      orderBy: {
        endTime: "desc",
      },
      take: APP_CONSTANTS.RECENT_NUM_JOBS_ACTIVITIES,
    });
    return list;
  } catch (error) {
    const msg = "Failed to fetch recent activities.";
    console.error(msg, error);
    throw new Error(msg);
  }
};

export const getActivityCalendarData = async (
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const { isAllUsers, userId } = await resolveDashboardScope(subjectUserId);
    const now = new Date();
    // Use local time for date range to match grouping
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );
    const daysAgo = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 365,
      0,
      0,
      0,
      0,
    );
    const jobData = await prisma.job.groupBy({
      by: "appliedDate",
      _count: {
        _all: true,
      },
      where: {
        ...userWhere(isAllUsers, userId),
        applied: true,
        appliedDate: {
          gte: daysAgo,
          lte: today,
        },
      },
      orderBy: {
        appliedDate: "asc",
      },
    });

    const activityData = await prisma.activity.findMany({
      where: {
        ...userWhere(isAllUsers, userId),
        startTime: { gte: daysAgo, lte: today },
        duration: { not: null },
      },
      select: { startTime: true, duration: true },
    });

    const groupedJobs: Record<string, number> = jobData.reduce(
      (acc: Record<string, number>, job: any) => {
        if (!job.appliedDate) return acc;
        const date = format(new Date(job.appliedDate), "yyyy-MM-dd");
        acc[date] = (acc[date] || 0) + job._count._all;
        return acc;
      },
      {},
    );

    const groupedHours: Record<string, number> = activityData.reduce(
      (acc: Record<string, number>, activity) => {
        const date = format(new Date(activity.startTime), "yyyy-MM-dd");
        acc[date] = (acc[date] || 0) + (activity.duration || 0) / 60;
        return acc;
      },
      {},
    );

    const allDates = new Set([
      ...Object.keys(groupedJobs),
      ...Object.keys(groupedHours),
    ]);

    const groupedByYear = [...allDates].reduce(
      (acc: Record<string, any[]>, date) => {
        const year = date.split("-")[0];
        if (!acc[year]) acc[year] = [];
        acc[year].push({
          day: date,
          value: groupedJobs[date] || 0,
          hours: Math.round((groupedHours[date] || 0) * 10) / 10,
        });
        return acc;
      },
      {},
    );

    return groupedByYear;
  } catch (error) {
    const msg = "Failed to fetch jobs list. ";
    console.error(msg, error);
    throw new Error(msg);
  }
};
