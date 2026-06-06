"use server";

import prisma from "@/lib/db";
import { isAdminRole, isRegularJobBidderRole } from "@/lib/user-roles";
import { getViewerContext } from "@/utils/user.utils";
import { endOfDay, startOfDay } from "date-fns";
import type { UserRole } from "@prisma/client";

export type JobBidderScore = {
  userId: string;
  name: string;
  isViewer: boolean;
  count?: number;
};

export type TodayJobBidsLeaderboard = {
  totalBids: number;
  topBidders: JobBidderScore[];
  leaders: JobBidderScore[];
  isAdminView: boolean;
  viewerRole: UserRole;
  showBidEncouragement: boolean;
};

function normalizeUserId(userId: string) {
  return userId.trim().toLowerCase();
}

async function resolveCanonicalViewer(viewer: {
  id: string;
  email: string;
}) {
  const byId = await prisma.user.findUnique({
    where: { id: viewer.id },
    select: { id: true },
  });
  if (byId) {
    return byId;
  }

  if (!viewer.email) {
    return null;
  }

  return prisma.user.findUnique({
    where: { email: viewer.email },
    select: { id: true },
  });
}

function withViewerFlag<T extends { userId: string }>(
  entries: T[],
  viewerId: string,
): (T & { isViewer: boolean })[] {
  const normalizedViewerId = normalizeUserId(viewerId);
  return entries.map((entry) => ({
    ...entry,
    isViewer: normalizeUserId(entry.userId) === normalizedViewerId,
  }));
}

function sanitizeBidderScores(
  entries: Array<{ userId: string; name: string; count: number; isViewer: boolean }>,
  isAdminView: boolean,
): JobBidderScore[] {
  if (isAdminView) {
    return entries;
  }

  return entries.map(({ userId, name, isViewer }) => ({
    userId,
    name,
    isViewer,
  }));
}

export async function getTodayJobBidsLeaderboard(): Promise<TodayJobBidsLeaderboard> {
  const viewer = await getViewerContext();
  if (!viewer) {
    throw new Error("Not authenticated");
  }

  const isAdminView = isAdminRole(viewer.role);
  const canonicalViewer = await resolveCanonicalViewer(viewer);
  if (!canonicalViewer) {
    throw new Error("User not found");
  }

  const viewerId = canonicalViewer.id;
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const jobs = await prisma.job.findMany({
    where: {
      applied: true,
      appliedDate: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    select: {
      userId: true,
      User: { select: { name: true } },
    },
  });

  const counts = new Map<string, { name: string; count: number }>();
  for (const job of jobs) {
    const existing = counts.get(job.userId);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(job.userId, { name: job.User.name, count: 1 });
    }
  }

  const leaders = Array.from(counts.entries())
    .map(([userId, { name, count }]) => ({ userId, name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const topCount = leaders[0]?.count ?? 0;
  const topBiddersRaw =
    topCount > 0 ? leaders.filter((leader) => leader.count === topCount) : [];

  const totalBids = isAdminView
    ? jobs.length
    : jobs.filter((job) => normalizeUserId(job.userId) === normalizeUserId(viewerId))
        .length;

  const leadersWithViewer = withViewerFlag(leaders.slice(0, 8), viewerId);
  const topBiddersWithViewer = withViewerFlag(topBiddersRaw, viewerId);
  const topBidders = sanitizeBidderScores(topBiddersWithViewer, isAdminView);
  const isViewerTopBidder = topBidders.some((bidder) => bidder.isViewer);
  const showBidEncouragement =
    isRegularJobBidderRole(viewer.role) && !isViewerTopBidder;

  return {
    totalBids,
    topBidders,
    leaders: sanitizeBidderScores(leadersWithViewer, isAdminView),
    isAdminView,
    viewerRole: viewer.role,
    showBidEncouragement,
  };
}
