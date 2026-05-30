import { auth } from "@/auth";
import { Metadata } from "next";

import { getJobSourceList, getStatusList } from "@/actions/job.actions";
import JobsContainer from "@/components/myjobs/JobsContainer";
import { getAllCompanies } from "@/actions/company.actions";
import { getAllJobTitles } from "@/actions/jobtitle.actions";
import { getAllJobLocations } from "@/actions/jobLocation.actions";
import { getAllTags } from "@/actions/tag.actions";

export const metadata: Metadata = {
  title: "My Jobs",
};

async function MyJobs() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const [statuses, companiesResult, titles, locations, sources, tags] =
    await Promise.all([
      getStatusList(),
      getAllCompanies(),
      getAllJobTitles(),
      getAllJobLocations(),
      getJobSourceList(),
      getAllTags(),
    ]);
  const companies = Array.isArray(companiesResult) ? companiesResult : [];
  return (
    <div className="col-span-3">
      <JobsContainer
        isAdmin={isAdmin}
        companies={companies}
        titles={titles}
        locations={locations}
        sources={sources}
        statuses={statuses}
        tags={tags ?? []}
      />
    </div>
  );
}

export default MyJobs;
