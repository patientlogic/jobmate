"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Loader, Search } from "lucide-react";
import { toast } from "../ui/use-toast";
import { APP_CONSTANTS } from "@/lib/constants";
import Loading from "../Loading";
import { RecordsPerPageSelector } from "../RecordsPerPageSelector";
import { RecordsCount } from "../RecordsCount";
import MeetingsTable from "./MeetingsTable";
import { MeetingForm } from "./MeetingForm";
import type { AppliedJobOption, Meeting } from "@/models/meeting.model";
import {
  getAppliedJobsForMeeting,
  getAssignedMeetingsList,
  getMeetingById,
} from "@/actions/meeting.actions";

type AssignedMeetingsContainerProps = {
  isAdmin?: boolean;
};

export default function AssignedMeetingsContainer({
  isAdmin = false,
}: AssignedMeetingsContainerProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<AppliedJobOption[]>([]);
  const [page, setPage] = useState(1);
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recordsPerPage, setRecordsPerPage] = useState<number>(
    APP_CONSTANTS.RECORDS_PER_PAGE,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const hasSearched = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMeetings = useCallback(
    async (pageNum: number, search?: string) => {
      if (pageNum === 1) setInitialLoading(true);
      else setLoadingMore(true);

      const { success, data, total, message } = await getAssignedMeetingsList(
        pageNum,
        recordsPerPage,
        search,
      );

      if (success && data) {
        setMeetings((prev) => (pageNum === 1 ? data : [...prev, ...data]));
        setTotalMeetings(total);
        setPage(pageNum);
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
    [recordsPerPage],
  );

  const reloadMeetings = useCallback(async () => {
    await loadMeetings(1, searchTerm || undefined);
  }, [loadMeetings, searchTerm]);

  const loadAppliedJobs = useCallback(async (ownerUserId?: string) => {
    if (!ownerUserId) {
      setAppliedJobs([]);
      return;
    }

    const { success, data, message } =
      await getAppliedJobsForMeeting(ownerUserId);
    if (success && data) {
      setAppliedJobs(data);
    } else {
      setAppliedJobs([]);
      toast({
        variant: "destructive",
        title: "Error!",
        description: message,
      });
    }
  }, []);

  useEffect(() => {
    void loadMeetings(1);
  }, [loadMeetings]);

  useEffect(() => {
    if (!hasSearched.current) {
      hasSearched.current = true;
      return;
    }

    const timeout = setTimeout(() => {
      void loadMeetings(1, searchTerm || undefined);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm, loadMeetings]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          !initialLoading &&
          !loadingMore &&
          meetings.length < totalMeetings
        ) {
          void loadMeetings(page + 1, searchTerm || undefined);
        }
      },
      { rootMargin: "100px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    initialLoading,
    loadingMore,
    meetings.length,
    totalMeetings,
    page,
    loadMeetings,
    searchTerm,
  ]);

  const onEditMeeting = async (meetingId: string) => {
    const { data, success, message } = await getMeetingById(meetingId);
    if (!success) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: message,
      });
      return;
    }
    setEditMeeting(data);
    void loadAppliedJobs(data.userId);
    setDialogOpen(true);
  };

  const resetEditMeeting = () => {
    setEditMeeting(null);
    setAppliedJobs([]);
  };

  return (
    <Card>
      <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Assigned Meetings</CardTitle>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Meetings assigned to developers across all users"
              : "Meetings assigned to you"}
          </p>
        </div>
        <div className="relative min-w-[140px] flex-1 sm:max-w-[240px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search assigned meetings..."
            className="h-8 w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {initialLoading && <Loading />}
        {!initialLoading && meetings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No assigned meetings yet.
          </p>
        ) : null}
        {!initialLoading && meetings.length > 0 ? (
          <MeetingsTable
            meetings={meetings}
            deleteMeeting={async () => {}}
            editMeeting={onEditMeeting}
            showMeetingOwner={isAdmin}
            showAssignedDeveloper={isAdmin}
            canDelete={false}
            canEdit={isAdmin}
          />
        ) : null}
        <div ref={sentinelRef} />
        {loadingMore ? (
          <div className="flex justify-center py-4">
            <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : null}
      </CardContent>
      {!initialLoading && meetings.length > 0 ? (
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <RecordsCount
            count={meetings.length}
            total={totalMeetings}
            label="meetings"
          />
          <RecordsPerPageSelector
            value={recordsPerPage}
            onChange={(value) => {
              setRecordsPerPage(value);
              void loadMeetings(1, searchTerm || undefined);
            }}
          />
        </CardFooter>
      ) : null}

      {isAdmin && editMeeting ? (
        <MeetingForm
          appliedJobs={appliedJobs}
          editMeeting={editMeeting}
          resetEditMeeting={resetEditMeeting}
          onMeetingSaved={reloadMeetings}
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          subjectUserId={editMeeting.userId}
          isAdmin={isAdmin}
        />
      ) : null}
    </Card>
  );
}
