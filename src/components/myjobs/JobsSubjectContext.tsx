"use client";

import { createContext, useContext } from "react";

const JobsSubjectContext = createContext<string | undefined>(undefined);

export function JobsSubjectProvider({
  subjectUserId,
  children,
}: {
  subjectUserId?: string;
  children: React.ReactNode;
}) {
  return (
    <JobsSubjectContext.Provider value={subjectUserId}>
      {children}
    </JobsSubjectContext.Provider>
  );
}

export function useJobsSubjectUserId() {
  return useContext(JobsSubjectContext);
}

function buildMyJobsPath(subjectUserId?: string) {
  return subjectUserId
    ? `/dashboard/jobs?userId=${subjectUserId}`
    : "/dashboard/jobs";
}

export function buildMyJobDetailPath(jobId: string, subjectUserId?: string) {
  const base = `/dashboard/jobs/${jobId}`;
  return subjectUserId ? `${base}?userId=${subjectUserId}` : base;
}

export { buildMyJobsPath };
