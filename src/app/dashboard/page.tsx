import { auth } from "@/auth";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import { DashboardAdminFilter } from "@/components/dashboard/DashboardAdminFilter";
import { ALL_USERS_SUBJECT_ID, isAllUsersScope } from "@/lib/admin-scope.constants";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

type PageProps = {
  searchParams: Promise<{ userId?: string }>;
};

export default async function Dashboard({ searchParams }: PageProps) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const { userId: rawUserId } = await searchParams;

  let subjectUserId: string | undefined;
  if (isAdmin) {
    const isAllUsers = !rawUserId || isAllUsersScope(rawUserId);
    subjectUserId = isAllUsers
      ? ALL_USERS_SUBJECT_ID
      : rawUserId === "self"
        ? undefined
        : rawUserId;
  }

  return (
    <>
      {isAdmin ? <DashboardAdminFilter /> : null}
      <DashboardOverview subjectUserId={subjectUserId} isAdmin={isAdmin} />
    </>
  );
}
