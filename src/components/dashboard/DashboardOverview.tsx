import {
  getActivityCalendarData,
  getActivityDataForPeriod,
  getJobsActivityForPeriod,
  getInterviewJobsForPeriod,
  getJobsAppliedForPeriod,
  getInterviewsForPeriod,
  getRecentActivities,
  getRecentJobs,
  getTopActivityTypesByDuration,
} from "@/actions/dashboard.actions";
import ActivityCalendar from "@/components/dashboard/ActivityCalendar";
import JobsApplied from "@/components/dashboard/JobsAppliedCard";
import NumberCardToggle from "@/components/dashboard/NumberCardToggle";
import RecentCardToggle from "@/components/dashboard/RecentCardToggle";
import TopActivitiesCard from "@/components/dashboard/TopActivitiesCard";
import WeeklyBarChartToggle from "@/components/dashboard/WeeklyBarChartToggle";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isAllUsersScope } from "@/lib/admin-scope.constants";

type DashboardOverviewProps = {
  /** When set (e.g. admin monitoring), dashboard metrics load for this user. */
  subjectUserId?: string;
  isAdmin?: boolean;
};

export default async function DashboardOverview({
  subjectUserId,
  isAdmin = false,
}: DashboardOverviewProps) {
  const isAllUsersView = isAllUsersScope(subjectUserId);
  const showQuickActions = !isAdmin || subjectUserId === undefined;
  const disableJobLinks =
    isAdmin && subjectUserId !== undefined && !isAllUsersView;

  const [
    { count: jobsAppliedLast7Days, trend: trendFor7Days },
    { count: jobsAppliedLast30Days, trend: trendFor30Days },
    { count: interviewsLast7Days, trend: interviewsTrendFor7Days },
    { count: interviewsLast30Days, trend: interviewsTrendFor30Days },
    recentJobs,
    recentActivities,
    weeklyData,
    interviewsData,
    activitiesData,
    activityCalendarData,
    topActivities7Days,
    topActivities30Days,
  ] = await Promise.all([
    getJobsAppliedForPeriod(7, subjectUserId),
    getJobsAppliedForPeriod(30, subjectUserId),
    getInterviewsForPeriod(7, subjectUserId),
    getInterviewsForPeriod(30, subjectUserId),
    getRecentJobs(subjectUserId),
    getRecentActivities(subjectUserId),
    getJobsActivityForPeriod(subjectUserId),
    getInterviewJobsForPeriod(subjectUserId),
    getActivityDataForPeriod(subjectUserId),
    getActivityCalendarData(subjectUserId),
    getTopActivityTypesByDuration(7, subjectUserId),
    getTopActivityTypesByDuration(30, subjectUserId),
  ]);
  const activityCalendarDataKeys = Object.keys(activityCalendarData);
  const activitiesDataKeys = (data: string[]) =>
    Array.from(
      new Set(
        data.flatMap((entry) =>
          Object.keys(entry).filter((key) => key !== "day"),
        ),
      ),
    );

  return (
    <>
      <div className="grid auto-rows-max items-start gap-2 md:gap-2 lg:col-span-3">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-5">
          {showQuickActions ? (
            <JobsApplied />
          ) : (
            <Card className="sm:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-muted-foreground">Overview</CardTitle>
                <CardDescription className="max-w-lg text-balance leading-relaxed">
                  {isAllUsersView
                    ? "Aggregated metrics across all users."
                    : "Read-only metrics for this job seeker. Job detail links from this view are disabled."}
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          <NumberCardToggle
            title="Jobs"
            metricLabel="Jobs Applied"
            data={[
              {
                label: "7d",
                num: jobsAppliedLast7Days,
                trend: trendFor7Days,
              },
              {
                label: "30d",
                num: jobsAppliedLast30Days,
                trend: trendFor30Days,
              },
            ]}
          />
          <NumberCardToggle
            title="Interviews"
            metricLabel="Interviews"
            data={[
              {
                label: "7d",
                num: interviewsLast7Days,
                trend: interviewsTrendFor7Days,
              },
              {
                label: "30d",
                num: interviewsLast30Days,
                trend: interviewsTrendFor30Days,
              },
            ]}
          />
          <TopActivitiesCard
            data={[
              { label: "7d", activities: topActivities7Days },
              { label: "30d", activities: topActivities30Days },
            ]}
          />
        </div>
        <WeeklyBarChartToggle
          charts={[
            {
              label: "Jobs",
              data: weeklyData,
              keys: ["value"],
              axisLeftLegend: "JOBS APPLIED",
            },
            {
              label: "Interviews",
              data: interviewsData,
              keys: ["value"],
              axisLeftLegend: "INTERVIEWS",
            },
            {
              label: "Activities",
              data: activitiesData,
              keys: activitiesDataKeys(activitiesData),
              groupMode: "stacked",
              axisLeftLegend: "TIME SPENT (Hours)",
            },
          ]}
        />
      </div>
      {/* <div>
        <RecentCardToggle
          jobs={recentJobs}
          activities={recentActivities}
          disableJobLinks={disableJobLinks}
          showJobSeeker={isAllUsersView}
        />
      </div> */}
      <div className="w-full col-span-3">
        <Tabs defaultValue={activityCalendarDataKeys.at(-1)}>
          <TabsList>
            {activityCalendarDataKeys.map((year) => (
              <TabsTrigger key={year} value={year}>
                {year}
              </TabsTrigger>
            ))}
          </TabsList>
          {activityCalendarDataKeys.map((year) => (
            <TabsContent key={year} value={year}>
              <ActivityCalendar year={year} data={activityCalendarData[year]} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
}
