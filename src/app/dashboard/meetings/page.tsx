import MeetingsContainer from "@/components/meetings/MeetingsContainer";
import { auth } from "@/auth";
import {
  canAccessMyMeetings,
  isAdminRole,
  parseUserRole,
} from "@/lib/user-roles";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Meetings",
};

export default async function MeetingsPage() {
  const session = await auth();
  const role = parseUserRole(session?.user?.role);

  if (!canAccessMyMeetings(role)) {
    redirect("/dashboard/assigned-meetings");
  }

  const isAdmin = isAdminRole(role);

  return (
    <div className="col-span-3">
      <MeetingsContainer isAdmin={isAdmin} />
    </div>
  );
}
