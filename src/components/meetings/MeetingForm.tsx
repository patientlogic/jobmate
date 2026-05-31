"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AddMeetingFormSchema } from "@/models/addMeetingForm.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  INTERVIEW_STEPS,
  MEETING_AREAS,
  MEETING_STATUSES,
  MEETING_TYPES,
  type AppliedJobOption,
  type Meeting,
  type MeetingResumeOption,
  type DeveloperOption,
  UNASSIGNED_DEVELOPER,
} from "@/models/meeting.model";
import { getBrowserTimeZone } from "@/lib/timezones";
import { z } from "zod";
import { toast } from "../ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Combobox } from "../ComboBox";
import SelectFormCtrl from "../Select";
import { DatePicker } from "../DatePicker";
import { DateTimePicker } from "../DateTimePicker";
import { MeetingResumeUpload } from "./MeetingResumeUpload";
import { Input } from "../ui/input";
import TiptapEditor from "../TiptapEditor";
import { MeetingNotesCollapsibleSection } from "./MeetingNotesCollapsibleSection";
import {
  createMeeting,
  getMeetingJobPrefill,
  getMeetingJobResumeOptions,
  listDevelopersForMeeting,
  updateMeeting,
} from "@/actions/meeting.actions";
import { addMeetingNote } from "@/actions/meetingNote.actions";
import type { MeetingNoteDisplay } from "@/models/meetingNote.model";
import { addMinutes } from "date-fns";
import { Loader } from "lucide-react";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";

type MeetingFormProps = {
  appliedJobs: AppliedJobOption[];
  editMeeting?: Meeting | null;
  resetEditMeeting: () => void;
  onMeetingSaved: () => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  subjectUserId?: string;
  isAdmin?: boolean;
};

export function MeetingForm({
  appliedJobs,
  editMeeting,
  resetEditMeeting,
  onMeetingSaved,
  dialogOpen,
  setDialogOpen,
  subjectUserId,
  isAdmin = false,
}: MeetingFormProps) {
  const [isPending, startTransition] = useTransition();
  const [jobResumeOptions, setJobResumeOptions] = useState<MeetingResumeOption[]>(
    [],
  );
  const [developers, setDevelopers] = useState<DeveloperOption[]>([]);
  const [draftNotes, setDraftNotes] = useState<MeetingNoteDisplay[]>([]);
  const defaultTimes = useMemo(() => {
    const start = new Date();
    return {
      start,
      end: addMinutes(start, 60),
    };
  }, [dialogOpen, editMeeting?.id]);

  const form = useForm<z.infer<typeof AddMeetingFormSchema>>({
    resolver: zodResolver(AddMeetingFormSchema),
    defaultValues: {
      jobId: "",
      positionRole: "",
      accountName: "",
      startDateTime: defaultTimes.start,
      endDateTime: defaultTimes.end,
      timeZone: getBrowserTimeZone(),
      companyName: "",
      meetingLink: "",
      interviewStep: INTERVIEW_STEPS[0].value,
      meetingType: MEETING_TYPES[0].value,
      status: MEETING_STATUSES[0].value,
      area: "",
      address: "",
      resumeUrl: "",
      salaryExpectation: "",
      jobDescription: "",
    },
  });

  const { reset, watch, setValue } = form;
  const watchedJobId = watch("jobId");
  const timeZone = watch("timeZone");
  const skipPrefillForJobId = useRef<string | null>(null);

  useEffect(() => {
    skipPrefillForJobId.current = editMeeting?.jobId ?? null;
  }, [editMeeting]);

  useEffect(() => {
    if (!isAdmin || !editMeeting || !dialogOpen) {
      setDevelopers([]);
      return;
    }

    void (async () => {
      const { success, data, message } = await listDevelopersForMeeting();
      if (success && data) {
        setDevelopers(data);
        return;
      }

      toast({
        variant: "destructive",
        title: "Error!",
        description: message,
      });
    })();
  }, [isAdmin, editMeeting, dialogOpen]);

  useEffect(() => {
    if (!dialogOpen || !watchedJobId) {
      setJobResumeOptions([]);
      return;
    }

    void (async () => {
      const { success, data, message } =
        await getMeetingJobResumeOptions(watchedJobId, subjectUserId);
      if (success && data) {
        setJobResumeOptions(data);
        return;
      }

      setJobResumeOptions([]);
      toast({
        variant: "destructive",
        title: "Error!",
        description: message,
      });
    })();
  }, [watchedJobId, dialogOpen, subjectUserId]);

  useEffect(() => {
    if (!dialogOpen || !watchedJobId) return;
    if (skipPrefillForJobId.current === watchedJobId) {
      skipPrefillForJobId.current = null;
      return;
    }

    void (async () => {
      const { success, data, message } = await getMeetingJobPrefill(
        watchedJobId,
        subjectUserId,
      );
      if (!success || !data) {
        toast({
          variant: "destructive",
          title: "Error!",
          description: message,
        });
        return;
      }

      setValue("positionRole", data.positionRole, { shouldDirty: true });
      setValue("companyName", data.companyName, { shouldDirty: true });
      setValue("address", data.address, { shouldDirty: true });
      setValue("salaryExpectation", data.salaryExpectation, { shouldDirty: true });
      setValue("resumeUrl", data.resumeUrl, { shouldDirty: true });
      setValue("jobDescription", data.jobDescription, { shouldDirty: true });
    })();
  }, [watchedJobId, dialogOpen, setValue, subjectUserId]);

  useEffect(() => {
    if (editMeeting) {
      reset({
        id: editMeeting.id,
        jobId: editMeeting.jobId,
        positionRole: editMeeting.positionRole,
        accountName: editMeeting.accountName,
        startDateTime: new Date(editMeeting.startTime),
        endDateTime: new Date(editMeeting.endTime),
        timeZone: editMeeting.timeZone || getBrowserTimeZone(),
        companyName: editMeeting.companyName,
        meetingLink: editMeeting.meetingLink ?? "",
        interviewStep: editMeeting.interviewStep,
        meetingType: editMeeting.meetingType,
        status: editMeeting.status,
        area: editMeeting.area ?? "",
        address: editMeeting.address ?? "",
        dob: editMeeting.dob ? new Date(editMeeting.dob) : undefined,
        resumeUrl: editMeeting.resumeUrl ?? "",
        salaryExpectation: editMeeting.salaryExpectation ?? "",
        jobDescription: editMeeting.jobDescription ?? "",
        assignedDeveloperId:
          editMeeting.assignedDeveloperId ?? UNASSIGNED_DEVELOPER,
      });
      setDraftNotes([]);
      return;
    }

    reset({
      jobId: "",
      positionRole: "",
      accountName: "",
      startDateTime: defaultTimes.start,
      endDateTime: defaultTimes.end,
      timeZone: getBrowserTimeZone(),
      companyName: "",
      meetingLink: "",
      interviewStep: INTERVIEW_STEPS[0].value,
      meetingType: MEETING_TYPES[0].value,
      status: MEETING_STATUSES[0].value,
      area: "",
      address: "",
      resumeUrl: "",
      salaryExpectation: "",
      jobDescription: "",
    });
    setDraftNotes([]);
  }, [editMeeting, reset, defaultTimes]);

  function onSubmit(data: z.infer<typeof AddMeetingFormSchema>) {
    startTransition(async () => {
      if (editMeeting) {
        const { success, message } = await updateMeeting(data, subjectUserId);

        if (success) {
          toast({
            variant: "success",
            description: "Meeting has been updated successfully",
          });
          reset();
          setDraftNotes([]);
          setDialogOpen(false);
          resetEditMeeting();
          onMeetingSaved();
        } else {
          toast({
            variant: "destructive",
            title: "Error!",
            description: message,
          });
        }
        return;
      }

      const { success, message, data: createdMeeting } = await createMeeting(
        data,
        subjectUserId,
      );

      if (!success || !createdMeeting) {
        toast({
          variant: "destructive",
          title: "Error!",
          description: message,
        });
        return;
      }

      if (draftNotes.length > 0) {
        const noteResults = await Promise.all(
          draftNotes.map((note) =>
            addMeetingNote({
              meetingId: createdMeeting.id,
              content: note.content,
            }),
          ),
        );

        const failedNote = noteResults.find((result) => !result.success);
        if (failedNote) {
          toast({
            variant: "destructive",
            title: "Error!",
            description:
              failedNote.message ??
              "Meeting was created, but some notes could not be saved.",
          });
          reset();
          setDraftNotes([]);
          setDialogOpen(false);
          resetEditMeeting();
          onMeetingSaved();
          return;
        }
      }

      toast({
        variant: "success",
        description: "Meeting has been created successfully",
      });
      reset();
      setDraftNotes([]);
      setDialogOpen(false);
      resetEditMeeting();
      onMeetingSaved();
    });
  }

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          resetEditMeeting();
          setDraftNotes([]);
        }
      }}
    >
      <DialogOverlay />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {editMeeting ? "Edit Meeting" : "New Meeting"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <FormField
              control={form.control}
              name="jobId"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Applied Job</FormLabel>
                  <Combobox
                    options={appliedJobs.map((job) => ({
                      id: job.id,
                      label: job.label,
                      value: job.label,
                    }))}
                    field={field}
                    searchPlaceholder="Search applied jobs..."
                    triggerClassName="w-full md:w-full lg:w-full"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {isAdmin && editMeeting ? (
              <FormField
                control={form.control}
                name="assignedDeveloperId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Assigned Developer</FormLabel>
                    <SelectFormCtrl
                      label="Assigned Developer"
                      options={[
                        {
                          id: UNASSIGNED_DEVELOPER,
                          label: "Unassigned",
                          value: "unassigned",
                        },
                        ...developers,
                      ]}
                      field={field}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="positionRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position/Role</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Software Engineer" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Account name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date & Time</FormLabel>
                  <DateTimePicker
                    field={field}
                    timeZone={timeZone || getBrowserTimeZone()}
                    onTimeZoneChange={(nextTimeZone) =>
                      setValue("timeZone", nextTimeZone, { shouldDirty: true })
                    }
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date & Time</FormLabel>
                  <DateTimePicker
                    field={field}
                    timeZone={timeZone || getBrowserTimeZone()}
                    onTimeZoneChange={(nextTimeZone) =>
                      setValue("timeZone", nextTimeZone, { shouldDirty: true })
                    }
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Company name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="meetingLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Link</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interviewStep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interview Step</FormLabel>
                  <SelectFormCtrl
                    label="Interview Step"
                    options={[...INTERVIEW_STEPS]}
                    field={field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="meetingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Type</FormLabel>
                  <SelectFormCtrl
                    label="Meeting Type"
                    options={[...MEETING_TYPES]}
                    field={field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <SelectFormCtrl
                    label="Status"
                    options={[...MEETING_STATUSES]}
                    field={field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Area</FormLabel>
                  <SelectFormCtrl label="Area" options={[...MEETING_AREAS]} field={field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DOB</FormLabel>
                  <div>
                    <DatePicker
                      field={field}
                      presets={false}
                      isEnabled
                      captionLayout
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resumeUrl"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Resume</FormLabel>
                  <FormControl>
                    <MeetingResumeUpload
                      value={field.value}
                      onChange={field.onChange}
                      resumeOptions={jobResumeOptions}
                      selectedJobId={watchedJobId}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salaryExpectation"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Salary Expectation</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Salary expectation" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobDescription"
              render={({ field }) => (
                <FormItem className="flex flex-col md:col-span-2">
                  <FormLabel id="job-description-label">
                    Job Description
                  </FormLabel>
                  <FormControl>
                    <TiptapEditor field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <MeetingNotesCollapsibleSection
              meetingId={editMeeting?.id}
              draftNotes={draftNotes}
              onDraftNotesChange={setDraftNotes}
            />

            <DialogFooter className="md:col-span-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editMeeting ? (
                  "Update Meeting"
                ) : (
                  "Save Meeting"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
