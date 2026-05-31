"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { format } from "date-fns";
import { formatUtcInTimeZone } from "@/lib/timezones";
import { getResumeLabelFromUrl } from "@/lib/resume-file.utils";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useState } from "react";
import type { Meeting } from "@/models/meeting.model";
import { DeleteAlertDialog } from "../DeleteAlertDialog";
import { MeetingDetailsDialog } from "./MeetingDetailsDialog";

type MeetingsTableProps = {
  meetings: Meeting[];
  deleteMeeting: (id: string) => void;
  editMeeting: (id: string) => void;
  showMeetingOwner?: boolean;
  showAssignedDeveloper?: boolean;
  canDelete?: boolean;
  canEdit?: boolean;
};

function formatMeetingTime(
  startTime: Date,
  endTime: Date,
  timeZone: string,
) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return `${formatUtcInTimeZone(start, timeZone)} – ${formatUtcInTimeZone(end, timeZone)}`;
}

function LinkCell({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  if (!href) return <span className="text-muted-foreground">—</span>;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline-offset-4 hover:underline"
    >
      {label}
    </a>
  );
}

export default function MeetingsTable({
  meetings,
  deleteMeeting,
  editMeeting,
  showMeetingOwner = false,
  showAssignedDeveloper = false,
  canDelete = true,
  canEdit = true,
}: MeetingsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const openDetails = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setDetailsOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">MID</TableHead>
              <TableHead className="whitespace-nowrap">JID</TableHead>
              {showMeetingOwner ? (
                <TableHead className="whitespace-nowrap">User</TableHead>
              ) : null}
              {showAssignedDeveloper ? (
                <TableHead className="whitespace-nowrap">Assigned Developer</TableHead>
              ) : null}
              <TableHead className="whitespace-nowrap">Position/Role</TableHead>
              <TableHead className="whitespace-nowrap">Account Name</TableHead>
              <TableHead className="whitespace-nowrap min-w-[220px]">
                Meeting Time
              </TableHead>
              <TableHead className="whitespace-nowrap">Company Name</TableHead>
              <TableHead className="whitespace-nowrap">Meeting Link</TableHead>
              <TableHead className="whitespace-nowrap">Interview Step</TableHead>
              <TableHead className="whitespace-nowrap">Meeting Type</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="whitespace-nowrap">Address</TableHead>
              <TableHead className="whitespace-nowrap">Area</TableHead>
              <TableHead className="whitespace-nowrap">DOB</TableHead>
              <TableHead className="whitespace-nowrap">Resume</TableHead>
              <TableHead className="whitespace-nowrap">Salary Expectation</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.map((meeting) => (
              <TableRow key={meeting.id}>
                <TableCell className="font-medium tabular-nums">
                  {meeting.mid}
                </TableCell>
                <TableCell className="font-medium tabular-nums">
                  {meeting.jobJid ?? "—"}
                </TableCell>
                {showMeetingOwner ? (
                  <TableCell className="whitespace-nowrap">
                    {meeting.User?.name ?? "—"}
                  </TableCell>
                ) : null}
                {showAssignedDeveloper ? (
                  <TableCell className="whitespace-nowrap">
                    {meeting.AssignedDeveloper?.name ?? "—"}
                  </TableCell>
                ) : null}
                <TableCell className="whitespace-nowrap">
                  <button
                    type="button"
                    className="cursor-pointer text-left font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => openDetails(meeting)}
                  >
                    {meeting.positionRole}
                  </button>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {meeting.accountName || "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatMeetingTime(
                    meeting.startTime,
                    meeting.endTime,
                    meeting.timeZone,
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {meeting.companyName}
                </TableCell>
                <TableCell className="max-w-[180px] truncate">
                  <LinkCell
                    href={meeting.meetingLink ?? ""}
                    label="Open link"
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {meeting.interviewStep}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {meeting.meetingType}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {meeting.status}
                </TableCell>
                <TableCell className="max-w-[180px] truncate">
                  {meeting.address || "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {meeting.area || "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {meeting.dob ? format(new Date(meeting.dob), "PP") : "—"}
                </TableCell>
                <TableCell className="max-w-[180px] truncate">
                  <LinkCell
                    href={meeting.resumeUrl ?? ""}
                    label={
                      meeting.resumeUrl
                        ? getResumeLabelFromUrl(meeting.resumeUrl)
                        : "—"
                    }
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {meeting.salaryExpectation || "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => openDetails(meeting)}
                      >
                        View details
                      </DropdownMenuItem>
                      {canEdit ? (
                        <DropdownMenuItem onClick={() => editMeeting(meeting.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      ) : null}
                      {canDelete ? (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(meeting.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MeetingDetailsDialog
        meeting={selectedMeeting}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEdit={editMeeting}
        canEdit={canEdit}
      />

      <DeleteAlertDialog
        pageTitle="meeting"
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onDelete={() => {
          if (deleteId) {
            deleteMeeting(deleteId);
            setDeleteId(null);
          }
        }}
      />
    </>
  );
}
