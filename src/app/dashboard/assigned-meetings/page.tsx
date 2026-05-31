import { redirect } from "next/navigation";
import AssignedMeetingsContainer from "@/components/meetings/AssignedMeetingsContainer";
import { auth } from "@/auth";
import {
  canAccessAssignedMeetings,
  isAdminRole,
  parseUserRole,
} from "@/lib/user-roles";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assigned Meetings",
};

export default async function AssignedMeetingsPage() {
  const session = await auth();
  const role = parseUserRole(session?.user?.role);

  if (!canAccessAssignedMeetings(role)) {
    redirect("/dashboard");
  }

  const isAdmin = isAdminRole(role);

  return (
    <div className="col-span-3">
      <AssignedMeetingsContainer isAdmin={isAdmin} />
    </div>
  );
}
