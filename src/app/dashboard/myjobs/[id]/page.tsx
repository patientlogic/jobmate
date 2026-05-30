import { getJobDetails } from "@/actions/job.actions";
import JobDetails from "@/components/myjobs/JobDetails";
import { JobsSubjectProvider } from "@/components/myjobs/JobsSubjectContext";
import { notFound } from "next/navigation";

async function JobDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ userId?: string }>;
}) {
  const { id } = await params;
  const { userId } = await searchParams;
  const { job, success } = await getJobDetails(id, userId);

  if (!success || !job) {
    notFound();
  }

  return (
    <div className="col-span-3">
      <JobsSubjectProvider subjectUserId={userId}>
        <JobDetails job={job} />
      </JobsSubjectProvider>
    </div>
  );
}

export default JobDetailsPage;
