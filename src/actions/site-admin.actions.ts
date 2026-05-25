"use server";

import prisma from "@/lib/db";
import { UserRole } from "@prisma/client";
import { getViewerContext } from "@/utils/user.utils";

export type JobBidderSummary = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  jobsTotal: number;
  jobsAppliedCount: number;
};

function assertSiteAdmin(viewerRole: UserRole): void {
  if (viewerRole !== UserRole.ADMIN) {
    throw new Error("Forbidden");
  }
}

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
    appliedByUser.map((r) => [r.userId, r._count._all]),
  );

  const totalsByUser = await prisma.job.groupBy({
    by: ["userId"],
    _count: { _all: true },
  });
  const totalMap = new Map(
    totalsByUser.map((r) => [r.userId, r._count._all]),
  );

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return users.map((u) => ({
    ...u,
    jobsTotal: totalMap.get(u.id) ?? 0,
    jobsAppliedCount: appliedMap.get(u.id) ?? 0,
  }));
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
