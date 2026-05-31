"use client";

import { format } from "date-fns";
import { Pencil } from "lucide-react";

import { formatTimeZoneLabel, formatUtcInTimeZone } from "@/lib/timezones";
import { getResumeLabelFromUrl } from "@/lib/resume-file.utils";
import type { Meeting } from "@/models/meeting.model";
import { TipTapContentViewer } from "@/components/TipTapContentViewer";
import { MeetingNotesSection } from "@/components/meetings/MeetingNotesSection";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type MeetingDetailsDialogProps = {
  meeting: Meeting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (meetingId: string) => void;
  canEdit?: boolean;
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

function formatMeetingTime(meeting: Meeting) {
  const start = new Date(meeting.startTime);
  const end = new Date(meeting.endTime);
  const timeZoneLabel = formatTimeZoneLabel(meeting.timeZone);
  return `${formatUtcInTimeZone(start, meeting.timeZone)} – ${formatUtcInTimeZone(end, meeting.timeZone)} (${timeZoneLabel})`;
}

export function MeetingDetailsDialog({
  meeting,
  open,
  onOpenChange,
  onEdit,
  canEdit = true,
}: MeetingDetailsDialogProps) {
  if (!meeting) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col overflow-y-auto sm:max-w-2xl"
      >
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pr-8">
          <SheetTitle>Meeting #{meeting.mid}</SheetTitle>
          <p className="shrink-0 text-lg font-semibold text-foreground tabular-nums">
            {meeting.jobJid != null ? `Job ID #${meeting.jobJid}` : "Job ID —"}
          </p>
        </SheetHeader>

        <dl className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailItem label="Status">{meeting.status}</DetailItem>
          {meeting.AssignedDeveloper ? (
            <DetailItem label="Assigned Developer">
              {meeting.AssignedDeveloper.name}
            </DetailItem>
          ) : null}
          <DetailItem label="Position/Role">{meeting.positionRole}</DetailItem>
          <DetailItem label="Account Name">
            {meeting.accountName || "—"}
          </DetailItem>
          <DetailItem label="Company Name">{meeting.companyName}</DetailItem>
          <DetailItem label="Meeting Type">{meeting.meetingType}</DetailItem>
          <DetailItem label="Interview Step">{meeting.interviewStep}</DetailItem>
          <DetailItem label="Area">{meeting.area || "—"}</DetailItem>
          <DetailItem label="Meeting Time">
            {formatMeetingTime(meeting)}
          </DetailItem>
          <DetailItem label="DOB">
            {meeting.dob ? format(new Date(meeting.dob), "PP") : "—"}
          </DetailItem>
          <DetailItem label="Meeting Link">
            {meeting.meetingLink ? (
              <a
                href={meeting.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                {meeting.meetingLink}
              </a>
            ) : (
              "—"
            )}
          </DetailItem>
          <DetailItem label="Salary Expectation">
            {meeting.salaryExpectation || "—"}
          </DetailItem>
          <DetailItem label="Address">{meeting.address || "—"}</DetailItem>
          <div className="sm:col-span-2">
            <DetailItem label="Job Description">
              {meeting.jobDescription ? (
                <TipTapContentViewer content={meeting.jobDescription} />
              ) : (
                "—"
              )}
            </DetailItem>
          </div>
          <DetailItem label="Resume">
            {meeting.resumeUrl ? (
              <a
                href={meeting.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                {getResumeLabelFromUrl(meeting.resumeUrl)}
              </a>
            ) : (
              "—"
            )}
          </DetailItem>
        </dl>

        <MeetingNotesSection meetingId={meeting.id} />

        <SheetFooter className="mt-6 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canEdit ? (
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onEdit(meeting.id);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
