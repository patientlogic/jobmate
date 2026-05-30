"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getAllAppliedJobsList,
  listJobBidders,
  type AdminAppliedJob,
  type AppliedJobsFilters,
  type JobBidderSummary,
} from "@/actions/site-admin.actions";
import { getAllCompanies } from "@/actions/company.actions";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Calendar as CalendarIcon, Loader, Search, X } from "lucide-react";
import Loading from "../Loading";
import AppliedJobsTable from "./AppliedJobsTable";
import { APP_CONSTANTS } from "@/lib/constants";
import { RecordsCount } from "../RecordsCount";
import { RecordsPerPageSelector } from "../RecordsPerPageSelector";
import { toast } from "../ui/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type CompanyOption = {
  id: string;
  label: string;
  value: string;
};

function AppliedJobsContainer() {
  const [jobs, setJobs] = useState<AdminAppliedJob[]>([]);
  const [page, setPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [jobSeekerFilter, setJobSeekerFilter] = useState<string>();
  const [companyFilter, setCompanyFilter] = useState<string>();
  const [appliedDateFilter, setAppliedDateFilter] = useState<Date>();
  const [jobSeekers, setJobSeekers] = useState<JobBidderSummary[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [recordsPerPage, setRecordsPerPage] = useState<number>(
    APP_CONSTANTS.RECORDS_PER_PAGE,
  );
  const hasSearched = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const buildFilters = useCallback((): AppliedJobsFilters | undefined => {
    const filters: AppliedJobsFilters = {};

    if (jobSeekerFilter) {
      filters.jobSeekerId = jobSeekerFilter;
    }
    if (companyFilter) {
      filters.companyValue = companyFilter;
    }
    if (appliedDateFilter) {
      filters.appliedDate = format(appliedDateFilter, "yyyy-MM-dd");
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [jobSeekerFilter, companyFilter, appliedDateFilter]);

  const loadJobs = useCallback(
    async (page: number, search?: string) => {
      if (page === 1) setInitialLoading(true);
      else setLoadingMore(true);

      const { success, data, total, message } = await getAllAppliedJobsList(
        page,
        recordsPerPage,
        search,
        buildFilters(),
      );

      if (success && data) {
        setJobs((prev) => (page === 1 ? data : [...prev, ...data]));
        setTotalJobs(total ?? 0);
        setPage(page);
      } else {
        toast({
          variant: "destructive",
          title: "Error!",
          description: message,
        });
      }

      setInitialLoading(false);
      setLoadingMore(false);
    },
    [recordsPerPage, buildFilters],
  );

  useEffect(() => {
    async function loadFilterOptions() {
      const [bidders, companyList] = await Promise.all([
        listJobBidders(),
        getAllCompanies(),
      ]);

      setJobSeekers(bidders.filter((b) => b.jobsAppliedCount > 0));

      if (Array.isArray(companyList)) {
        setCompanies(companyList);
      }
    }

    loadFilterOptions().catch(() => {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load filter options.",
      });
    });
  }, []);

  useEffect(() => {
    loadJobs(1, searchTerm || undefined);
  }, [loadJobs]);

  useEffect(() => {
    if (searchTerm !== "") {
      hasSearched.current = true;
    }
    if (searchTerm === "" && !hasSearched.current) return;

    const timer = setTimeout(() => {
      loadJobs(1, searchTerm || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, loadJobs]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !initialLoading &&
          !loadingMore &&
          jobs.length < totalJobs
        ) {
          loadJobs(page + 1, searchTerm || undefined);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    jobs.length,
    totalJobs,
    page,
    searchTerm,
    initialLoading,
    loadingMore,
    loadJobs,
  ]);

  const jobSeekerLabel = jobSeekerFilter
    ? jobSeekers.find((j) => j.id === jobSeekerFilter)?.name
    : undefined;

  const companyLabel = companyFilter
    ? companies.find((c) => c.value === companyFilter)?.label
    : undefined;

  return (
    <div className="col-span-3">
      <Card>
        <CardHeader className="flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <CardTitle>Applied Jobs</CardTitle>
            <div className="relative flex-1 min-w-[140px] sm:flex-none">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search jobs..."
                className="pl-8 h-8 w-full sm:w-[150px] lg:w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {jobSeekerLabel && (
              <button
                type="button"
                onClick={() => setJobSeekerFilter(undefined)}
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                {jobSeekerLabel}
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {companyLabel && (
              <button
                type="button"
                onClick={() => setCompanyFilter(undefined)}
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                {companyLabel}
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {appliedDateFilter && (
              <button
                type="button"
                onClick={() => setAppliedDateFilter(undefined)}
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                {format(appliedDateFilter, "PP")}
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <Select
              value={jobSeekerFilter ?? "all"}
              onValueChange={(value) =>
                setJobSeekerFilter(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="h-8 w-[180px]" aria-label="Filter by job seeker">
                <SelectValue placeholder="Job seeker" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Job seeker</SelectLabel>
                  <SelectItem value="all">All job seekers</SelectItem>
                  {jobSeekers.map((seeker) => (
                    <SelectItem key={seeker.id} value={seeker.id}>
                      {seeker.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={companyFilter ?? "all"}
              onValueChange={(value) =>
                setCompanyFilter(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="h-8 w-[180px]" aria-label="Filter by company">
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Company</SelectLabel>
                  <SelectItem value="all">All companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.value}>
                      {company.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 justify-start text-left font-normal",
                    !appliedDateFilter && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {appliedDateFilter
                    ? format(appliedDateFilter, "PP")
                    : "Date applied"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={appliedDateFilter}
                  onSelect={setAppliedDateFilter}
                  captionLayout="dropdown"
                  startMonth={new Date(2020, 0)}
                  endMonth={new Date()}
                  className="rounded-md border"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {initialLoading && <Loading />}
          {!initialLoading && jobs.length > 0 && (
            <>
              <AppliedJobsTable jobs={jobs} />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-4">
                <RecordsCount
                  count={jobs.length}
                  total={totalJobs}
                  label="jobs"
                />
                {totalJobs > APP_CONSTANTS.RECORDS_PER_PAGE && (
                  <RecordsPerPageSelector
                    value={recordsPerPage}
                    onChange={setRecordsPerPage}
                  />
                )}
              </div>
            </>
          )}
          {!initialLoading && jobs.length === 0 && (
            <p className="text-sm text-muted-foreground">No applied jobs yet.</p>
          )}
          {jobs.length < totalJobs && (
            <div ref={sentinelRef} className="flex justify-center p-4">
              {loadingMore && (
                <Loader className="h-5 w-5 animate-spin text-blue-500" />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AppliedJobsContainer;
