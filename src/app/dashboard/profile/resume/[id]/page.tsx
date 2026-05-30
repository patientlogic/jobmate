import { getResumeById } from "@/actions/profile.actions";
import ResumeContainer from "@/components/profile/ResumeContainer";
import { ProfileSubjectProvider } from "@/components/profile/ProfileSubjectContext";
import { notFound } from "next/navigation";

async function ResumePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ userId?: string }>;
}) {
  const { id } = await params;
  const { userId } = await searchParams;
  const { data: resume, success } = await getResumeById(id, userId);

  if (!success || !resume) {
    notFound();
  }

  return (
    <div className="col-span-3">
      <ProfileSubjectProvider subjectUserId={userId}>
        <ResumeContainer resume={resume} />
      </ProfileSubjectProvider>
    </div>
  );
}

export default ResumePage;
