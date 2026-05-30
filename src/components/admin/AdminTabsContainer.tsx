"use client";
import ActivityTypesContainer from "@/components/admin/ActivityTypesContainer";
import CompaniesContainer from "@/components/admin/CompaniesContainer";
import JobLocationsContainer from "@/components/admin/JobLocationsContainer";
import JobSourcesContainer from "@/components/admin/JobSourcesContainer";
import JobTitlesContainer from "@/components/admin/JobTitlesContainer";
import TagsContainer from "@/components/admin/TagsContainer";
import UsersContainer from "@/components/admin/UsersContainer";
import AppliedJobsContainer from "@/components/admin/AppliedJobsContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type AdminTabsContainerProps = {
  isAdmin?: boolean;
};

function AdminTabsContainer({ isAdmin = false }: AdminTabsContainerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(queryParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [queryParams],
  );

  const defaultTab =
    queryParams.get("tab") || (isAdmin ? "companies" : "job-titles");

  const onTabChange = (tab: string) => {
    router.push(pathname + "?" + createQueryString("tab", tab));
  };
  return (
    <Tabs
      defaultValue={defaultTab}
      onValueChange={(e) => onTabChange(e)}
    >
      <TabsList>
        {isAdmin ? <TabsTrigger value="companies">Companies</TabsTrigger> : null}
        <TabsTrigger value="job-titles">Job Titles</TabsTrigger>
        <TabsTrigger value="locations">Locations</TabsTrigger>
        <TabsTrigger value="sources">Sources</TabsTrigger>
        <TabsTrigger value="skills">Skills</TabsTrigger>
        <TabsTrigger value="activity-types">Activity Types</TabsTrigger>
        {isAdmin ? <TabsTrigger value="users">Users</TabsTrigger> : null}
        {isAdmin ? (
          <TabsTrigger value="applied-jobs">Applied Jobs</TabsTrigger>
        ) : null}
      </TabsList>
      {isAdmin ? (
        <TabsContent value="companies">
          <CompaniesContainer globalCatalog />
        </TabsContent>
      ) : null}
      <TabsContent value="job-titles">
        <JobTitlesContainer />
      </TabsContent>
      <TabsContent value="locations">
        <JobLocationsContainer />
      </TabsContent>
      <TabsContent value="sources">
        <JobSourcesContainer />
      </TabsContent>
      <TabsContent value="skills">
        <TagsContainer />
      </TabsContent>
      <TabsContent value="activity-types">
        <ActivityTypesContainer />
      </TabsContent>
      {isAdmin ? (
        <TabsContent value="users">
          <UsersContainer />
        </TabsContent>
      ) : null}
      {isAdmin ? (
        <TabsContent value="applied-jobs">
          <AppliedJobsContainer />
        </TabsContent>
      ) : null}
    </Tabs>
  );
}

export default AdminTabsContainer;
