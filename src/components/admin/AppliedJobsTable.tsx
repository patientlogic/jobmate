"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import type { AdminAppliedJob } from "@/actions/site-admin.actions";

type AppliedJobsTableProps = {
  jobs: AdminAppliedJob[];
};

function AppliedJobsTable({ jobs }: AppliedJobsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden w-[100px] sm:table-cell">
            <span className="sr-only">Company Logo</span>
          </TableHead>
          <TableHead className="hidden md:table-cell">Date Applied</TableHead>
          <TableHead>Job Seeker Name</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Company</TableHead>
          <TableHead className="hidden md:table-cell">Location</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell">Match</TableHead>
          <TableHead className="hidden md:table-cell">Source</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="hidden sm:table-cell">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Company logo"
                className="aspect-square rounded-md h-8 w-8 object-contain"
                src={job.Company?.logoUrl || "/logo.png"}
              />
            </TableCell>
            <TableCell className="hidden md:table-cell w-[120px]">
              {job.appliedDate ? format(job.appliedDate, "PP") : "N/A"}
            </TableCell>
            <TableCell className="font-medium max-w-[120px] sm:max-w-none">
              <Link
                href={`/dashboard/site-admin/${job.userId}`}
                className="block truncate text-primary underline-offset-4 hover:underline"
              >
                {job.jobSeekerName}
              </Link>
            </TableCell>
            <TableCell
              className="font-medium cursor-pointer max-w-[120px] sm:max-w-none"
            >
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/dashboard/myjobs/${job.id}?userId=${job.userId}`}
                  className="block truncate"
                >
                  {job.JobTitle?.label}
                </Link>
                {(job._count?.Notes ?? 0) > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-1.5 py-0 h-5 shrink-0"
                  >
                    <StickyNote className="h-3 w-3 mr-0.5" />
                    {job._count!.Notes}
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="font-medium max-w-[100px] sm:max-w-none">
              <span className="block truncate">{job.Company?.label}</span>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {job.Location?.label}
            </TableCell>
            <TableCell>
              {job.dueDate &&
              new Date() > job.dueDate &&
              job.Status?.value === "draft" ? (
                <Badge className="bg-red-500">Expired</Badge>
              ) : (
                <Badge
                  className={cn(
                    "w-[70px] justify-center",
                    job.Status?.value === "applied" && "bg-cyan-500",
                    job.Status?.value === "interview" && "bg-green-500",
                  )}
                >
                  {job.Status?.label}
                </Badge>
              )}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {job.matchScore != null ? `${job.matchScore}%` : "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {job.JobSource?.label}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default AppliedJobsTable;
