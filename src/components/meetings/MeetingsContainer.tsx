"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader, PlusCircle, Search } from "lucide-react";
import { toast } from "../ui/use-toast";
import { APP_CONSTANTS } from "@/lib/constants";
import Loading from "../Loading";
import { RecordsPerPageSelector } from "../RecordsPerPageSelector";
import { RecordsCount } from "../RecordsCount";
import MeetingsTable from "./MeetingsTable";
import { MeetingForm } from "./MeetingForm";
import type { AppliedJobOption, Meeting } from "@/models/meeting.model";
import {
  deleteMeetingById,
  getAppliedJobsForMeeting,
  getMeetingById,
  getMeetingsList,
} from "@/actions/meeting.actions";
import {
  listJobBidders,
  type JobBidderSummary,
} from "@/actions/site-admin.actions";
import { AdminUserSelector } from "../admin/AdminUserSelector";
import {
  ALL_USERS_SUBJECT_ID,
  isAllUsersScope,
} from "@/lib/admin-scope.constants";

type MeetingsContainerProps = {
  isAdmin?: boolean;
};

export default function MeetingsContainer({
  isAdmin = false,
}: MeetingsContainerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryParams = useSearchParams();
  const rawUserId = isAdmin ? queryParams.get("userId") : null;
  const isAllUsersView =
    isAdmin && (!rawUserId || isAllUsersScope(rawUserId));
  const subjectUserId = isAdmin
    ? isAllUsersView
      ? ALL_USERS_SUBJECT_ID
      : rawUserId === "self"
        ? undefined
        : rawUserId ?? undefined
    : undefined;
  const userSelectorValue = isAdmin
    ? isAllUsersView
      ? ALL_USERS_SUBJECT_ID
      : rawUserId === "self"
        ? "self"
        : (rawUserId ?? ALL_USERS_SUBJECT_ID)
    : "self";
  const scopedSubjectUserId = isAllUsersView ? undefined : subjectUserId;

  const [users, setUsers] = useState<JobBidderSummary[]>([]);
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

  const selectedUser =
    subjectUserId && !isAllUsersScope(subjectUserId)
      ? users.find((u) => u.id === subjectUserId)
      : undefined;

  useEffect(() => {
    if (!isAdmin) return;

    listJobBidders()
      .then(setUsers)
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Error!",
          description: "Failed to load users.",
        });
      });
  }, [isAdmin]);

  const onUserChange = (value: string) => {
    const params = new URLSearchParams(queryParams.toString());
    if (value === "self") {
      params.set("userId", "self");
    } else if (value === ALL_USERS_SUBJECT_ID) {
      params.delete("userId");
    } else {
      params.set("userId", value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const loadAppliedJobs = useCallback(async () => {
    if (isAllUsersView) {
      setAppliedJobs([]);
      return;
    }

    const { success, data, message } =
      await getAppliedJobsForMeeting(scopedSubjectUserId);
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
  }, [isAllUsersView, scopedSubjectUserId]);

  const loadMeetings = useCallback(
    async (pageNum: number, search?: string) => {
      if (pageNum === 1) setInitialLoading(true);
      else setLoadingMore(true);

      const { success, data, total, message } = await getMeetingsList(
        pageNum,
        recordsPerPage,
        search,
        subjectUserId,
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
    [recordsPerPage, subjectUserId],
  );

  const reloadMeetings = useCallback(async () => {
    await loadMeetings(1, searchTerm || undefined);
  }, [loadMeetings, searchTerm]);

  useEffect(() => {
    void loadAppliedJobs();
  }, [loadAppliedJobs]);

  useEffect(() => {
    void loadMeetings(1, searchTerm || undefined);
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

  const onDeleteMeeting = async (meetingId: string) => {
    const { success, message } = await deleteMeetingById(
      meetingId,
      subjectUserId,
    );
    if (success) {
      toast({
        variant: "success",
        description: "Meeting has been deleted successfully",
      });
      await reloadMeetings();
    } else {
      toast({
        variant: "destructive",
        title: "Error!",
        description: message,
      });
    }
  };

  const onEditMeeting = async (meetingId: string) => {
    const { data, success, message } = await getMeetingById(
      meetingId,
      subjectUserId,
    );
    if (!success) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: message,
      });
      return;
    }
    setEditMeeting(data);
    setDialogOpen(true);
  };

  const resetEditMeeting = () => setEditMeeting(null);

  const openNewMeeting = () => {
    resetEditMeeting();
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{isAdmin ? "Meetings" : "My Meetings"}</CardTitle>
          {isAdmin && isAllUsersView ? (
            <p className="text-sm text-muted-foreground">
              Viewing meetings for all users
            </p>
          ) : isAdmin && selectedUser ? (
            <p className="text-sm text-muted-foreground">
              Managing meetings for {selectedUser.name}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <AdminUserSelector
              users={users}
              value={userSelectorValue}
              onValueChange={onUserChange}
              selfLabel="My meetings"
              aria-label="Select user meetings"
            />
          ) : null}
          <div className="relative min-w-[140px] flex-1 sm:flex-none">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search meetings..."
              className="h-8 w-full pl-8 sm:w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {!isAllUsersView ? (
            <Button size="sm" className="h-8 gap-1" onClick={openNewMeeting}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                New Meeting
              </span>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {initialLoading && <Loading />}
        {!initialLoading && meetings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No meetings yet. Add your first meeting to track interviews.
          </p>
        ) : null}
        {!initialLoading && meetings.length > 0 ? (
          <MeetingsTable
            meetings={meetings}
            deleteMeeting={onDeleteMeeting}
            editMeeting={onEditMeeting}
            showMeetingOwner={isAllUsersView}
            showAssignedDeveloper
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
          <RecordsCount count={meetings.length} total={totalMeetings} label="meetings" />
          <RecordsPerPageSelector
            value={recordsPerPage}
            onChange={(value) => {
              setRecordsPerPage(value);
              void loadMeetings(1, searchTerm || undefined);
            }}
          />
        </CardFooter>
      ) : null}

      {!isAllUsersView ? (
        <MeetingForm
          appliedJobs={appliedJobs}
          editMeeting={editMeeting}
          resetEditMeeting={resetEditMeeting}
          onMeetingSaved={reloadMeetings}
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          subjectUserId={scopedSubjectUserId}
          isAdmin={isAdmin}
        />
      ) : null}
    </Card>
  );
}
