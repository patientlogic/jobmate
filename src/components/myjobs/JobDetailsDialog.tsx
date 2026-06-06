"use client";

import { format } from "date-fns";
import { Loader, Pencil } from "lucide-react";
import { useMemo } from "react";

import { getSalaryRangeLabel } from "@/lib/data/salaryRangeData";
import { cn, formatUrl } from "@/lib/utils";
import type { JobResponse } from "@/models/job.model";
import type { JobMatchResponse } from "@/models/ai.schemas";
import { TipTapContentViewer } from "@/components/TipTapContentViewer";
import { MatchDetails } from "@/components/automations/MatchDetails";
import { DownloadFileButton } from "@/components/profile/DownloadFileButton";
import { NotesSection } from "@/components/myjobs/NotesSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type JobDetailsDialogProps = {
  job: JobResponse | null;
  open: boolean;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (jobId: string) => void;
};

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm break-words">{children}</dd>
    </div>
  );
}

function getJobType(code: string) {
  switch (code) {
    case "FT":
      return "Full-time";
    case "PT":
      return "Part-time";
    case "C":
      return "Contract";
    default:
      return "Unknown";
  }
}

export function JobDetailsDialog({
  job,
  open,
  loading = false,
  onOpenChange,
  onEdit,
}: JobDetailsDialogProps) {
  const parsedMatchData = useMemo(() => {
    if (!job?.matchData) return null;
    try {
      return JSON.parse(job.matchData) as JobMatchResponse;
    } catch {
      return null;
    }
  }, [job?.matchData]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col overflow-y-auto sm:max-w-2xl"
      >
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : job ? (
          <>
            <SheetHeader className="flex flex-row items-center justify-between space-y-0 pr-8">
              <SheetTitle>{job.JobTitle?.label ?? "Job details"}</SheetTitle>
              <p className="shrink-0 text-lg font-semibold text-foreground tabular-nums">
                JID #{job.jid}
              </p>
            </SheetHeader>

            <dl className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem label="Status">
                {job.dueDate &&
                new Date() > new Date(job.dueDate) &&
                job.Status?.value === "draft" ? (
                  <Badge className="bg-red-500">Expired</Badge>
                ) : (
                  <Badge
                    className={cn(
                      "w-fit justify-center",
                      job.Status?.value === "applied" && "bg-cyan-500",
                      job.Status?.value === "interview" && "bg-green-500",
                    )}
                  >
                    {job.Status?.label}
                  </Badge>
                )}
              </DetailItem>
              <DetailItem label="Company">{job.Company?.label ?? "—"}</DetailItem>
              <DetailItem label="Location">
                {job.Location?.label ?? "—"}
              </DetailItem>
              <DetailItem label="Job Type">{getJobType(job.jobType)}</DetailItem>
              <DetailItem label="Source">
                {job.JobSource?.label ?? "—"}
              </DetailItem>
              <DetailItem label="Date Applied">
                {job.appliedDate
                  ? format(new Date(job.appliedDate), "PP")
                  : "—"}
              </DetailItem>
              <DetailItem label="Salary Range">
                {getSalaryRangeLabel(job.salaryRange) || "—"}
              </DetailItem>
              <DetailItem label="Match Score">
                {job.matchScore != null ? `${job.matchScore}%` : "—"}
              </DetailItem>
              <DetailItem label="Job Link">
                {job.jobUrl ? (
                  <a
                    href={formatUrl(job.jobUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {job.jobUrl}
                  </a>
                ) : (
                  "—"
                )}
              </DetailItem>
              <DetailItem label="Resume">
                {job.Resume?.File?.filePath ? (
                  DownloadFileButton(
                    job.Resume.File.filePath,
                    job.Resume.title,
                    job.Resume.File.fileName,
                  )
                ) : (
                  "—"
                )}
              </DetailItem>
              {job.tags && job.tags.length > 0 ? (
                <div className="sm:col-span-2">
                  <DetailItem label="Skills">
                    <div className="flex flex-wrap gap-1">
                      {job.tags.map((tag) => (
                        <Badge key={tag.id} variant="secondary">
                          {tag.label}
                        </Badge>
                      ))}
                    </div>
                  </DetailItem>
                </div>
              ) : null}
              <div className="sm:col-span-2">
                <DetailItem label="Job Description">
                  {job.description ? (
                    <TipTapContentViewer content={job.description} />
                  ) : (
                    "—"
                  )}
                </DetailItem>
              </div>
              {parsedMatchData ? (
                <div className="sm:col-span-2">
                  <DetailItem label="AI Match Analysis">
                    <MatchDetails matchData={parsedMatchData} />
                  </DetailItem>
                </div>
              ) : null}
            </dl>

            <NotesSection jobId={job.id} />

            <SheetFooter className="mt-6 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(job.id);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
