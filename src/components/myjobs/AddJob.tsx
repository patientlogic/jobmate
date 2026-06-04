"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { addJob, updateJob } from "@/actions/job.actions";
import { addNote } from "@/actions/note.actions";
import { Loader, PlusCircle, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import { useCallback, useEffect, useState, useTransition } from "react";
import { AddJobFormSchema } from "@/models/addJobForm.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Company,
  JOB_TYPES,
  JobLocation,
  JobResponse,
  JobSource,
  JobStatus,
  JobTitle,
  Tag,
} from "@/models/job.model";
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
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import SelectFormCtrl from "../Select";
import { SALARY_RANGES } from "@/lib/data/salaryRangeData";
import { APP_CONSTANTS } from "@/lib/constants";
import TiptapEditor from "../TiptapEditor";
import { Input } from "../ui/input";
import { Combobox } from "../ComboBox";
import { NotesCollapsibleSection, type DraftNote } from "./NotesCollapsibleSection";
import { Resume } from "@/models/profile.model";
import CreateResume from "../profile/CreateResume";
import { getResumeList } from "@/actions/profile.actions";
import { getAllCompanies } from "@/actions/company.actions";
import { TagInput } from "./TagInput";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

function getAppliedStatusId(statuses: JobStatus[]) {
  return statuses.find((status) => status.value === "applied")?.id ?? "";
}

function getNewJobFormValues(jobStatuses: JobStatus[]) {
  return {
    type: Object.keys(JOB_TYPES)[0],
    status: getAppliedStatusId(jobStatuses),
    applied: true,
    tags: [] as string[],
  };
}

function OptionalLabel({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}{" "}
      <span className="font-normal text-muted-foreground">(optional)</span>
    </>
  );
}

type AddJobProps = {
  jobStatuses: JobStatus[];
  companies: Company[];
  jobTitles: JobTitle[];
  locations: JobLocation[];
  jobSources: JobSource[];
  tags: Tag[];
  editJob?: JobResponse | null;
  resetEditJob: () => void;
  subjectUserId?: string;
  onJobSaved?: () => void;
};

export function AddJob({
  jobStatuses,
  companies,
  jobTitles,
  locations,
  jobSources,
  tags,
  editJob,
  resetEditJob,
  subjectUserId,
  onJobSaved,
}: AddJobProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<Company[]>(companies);
  const [jobTitleOptions, setJobTitleOptions] = useState<JobTitle[]>(jobTitles);
  const [locationOptions, setLocationOptions] = useState<JobLocation[]>(locations);
  const [sourceOptions, setSourceOptions] = useState<JobSource[]>(jobSources);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>(tags);
  const [draftNotes, setDraftNotes] = useState<DraftNote[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<z.infer<typeof AddJobFormSchema>>({
    resolver: zodResolver(AddJobFormSchema) as any,
    defaultValues: getNewJobFormValues(jobStatuses),
  });

  const { setValue, reset } = form;

  const loadResumes = useCallback(async () => {
    try {
      const resumes = await getResumeList(1, APP_CONSTANTS.RECORDS_PER_PAGE, subjectUserId);
      setResumes(resumes.data);
    } catch (error) {
      console.error("Failed to load resumes:", error);
    }
  }, [subjectUserId]);

  const loadCompanies = useCallback(async () => {
    try {
      const result = await getAllCompanies();
      if (Array.isArray(result)) {
        setCompanyOptions(result);
      }
    } catch (error) {
      console.error("Failed to load companies:", error);
    }
  }, []);

  useEffect(() => {
    setCompanyOptions(Array.isArray(companies) ? companies : []);
  }, [companies]);

  useEffect(() => {
    setJobTitleOptions(Array.isArray(jobTitles) ? jobTitles : []);
  }, [jobTitles]);

  useEffect(() => {
    setLocationOptions(Array.isArray(locations) ? locations : []);
  }, [locations]);

  useEffect(() => {
    setSourceOptions(Array.isArray(jobSources) ? jobSources : []);
  }, [jobSources]);

  useEffect(() => {
    if (dialogOpen) {
      loadCompanies();
      loadResumes();
    }
  }, [dialogOpen, loadCompanies, loadResumes]);

  useEffect(() => {
    if (editJob) {
      reset(
        {
          id: editJob.id,
          userId: editJob.userId,
          title: editJob.JobTitle.id,
          company: editJob.Company.id,
          location: editJob.Location?.id,
          type: editJob.jobType,
          source: editJob.JobSource?.id,
          status: editJob.Status.id,
          salaryRange: editJob.salaryRange,
          jobDescription: editJob.description,
          jobUrl: editJob.jobUrl ?? undefined,
          resume: editJob.Resume?.id ?? undefined,
          tags: editJob.tags?.map((t) => t.id) ?? [],
        },
        { keepDefaultValues: true },
      );
      // Merge any tags from editJob into the local pool so they're selectable
      if (editJob.tags && editJob.tags.length > 0) {
        setAvailableTags((prev) => {
          const existing = new Set(prev.map((t) => t.id));
          const incoming = editJob.tags!.filter((t) => !existing.has(t.id));
          return incoming.length > 0 ? [...prev, ...incoming] : prev;
        });
      }
      setDialogOpen(true);
      setAdvancedOpen(true);
    }
  }, [editJob, reset]);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  const setNewResumeId = (id: string) => {
    setTimeout(() => {
      setValue("resume", id);
    }, 500);
  };

  function onSubmit(data: z.infer<typeof AddJobFormSchema>) {
    startTransition(async () => {
      const result = editJob
        ? await updateJob(data, subjectUserId)
        : await addJob(data, subjectUserId);
      const success = result?.success;
      const message = result?.message;

      if (!success) {
        toast({
          variant: "destructive",
          title: "Error!",
          description: message,
        });
        return;
      }

      if (!editJob && result?.job?.id && draftNotes.length > 0) {
        for (const note of draftNotes) {
          const noteResult = await addNote(
            { jobId: result.job.id, content: note.content },
            subjectUserId,
          );
          if (!noteResult?.success) {
            toast({
              variant: "destructive",
              title: "Error!",
              description:
                noteResult?.message ??
                "Job saved, but one or more notes failed to save.",
            });
            break;
          }
        }
      }

      reset(getNewJobFormValues(jobStatuses));
      setDraftNotes([]);
      setDialogOpen(false);
      resetEditJob();
      onJobSaved?.();
      toast({
        variant: "success",
        description: `Job has been ${
          editJob ? "updated" : "created"
        } successfully`,
      });
    });
  }

  const pageTitle = editJob ? "Edit Job" : "Add Job";

  const addJobForm = () => {
    reset(getNewJobFormValues(jobStatuses));
    setDraftNotes([]);
    setAdvancedOpen(false);
    resetEditJob();
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDraftNotes([]);
    setAdvancedOpen(false);
    setDialogOpen(false);
  };

  const createResume = () => {
    setResumeDialogOpen(true);
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1"
        onClick={addJobForm}
        data-testid="add-job-btn"
      >
        <PlusCircle className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          New Job
        </span>
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogOverlay>
          <DialogContent className="h-full xl:h-[85vh] lg:h-[95vh] lg:max-w-screen-lg lg:max-h-screen overflow-y-scroll">
            <DialogHeader>
              <DialogTitle data-testid="add-job-dialog-title">
                {pageTitle}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4"
              >
                {/* Job URL */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="jobUrl"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Job URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Copy and paste job link here"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Resume */}
                <div className="md:col-span-2 flex items-end">
                  <FormField
                    control={form.control}
                    name="resume"
                    render={({ field }) => (
                      <FormItem className="flex flex-col [&>button]:capitalize flex-1">
                        <FormLabel>Resume</FormLabel>
                        <SelectFormCtrl
                          label="Resume"
                          options={resumes}
                          field={field}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button variant="link" type="button" onClick={createResume}>
                    Add New
                  </Button>
                  <CreateResume
                    resumeDialogOpen={resumeDialogOpen}
                    setResumeDialogOpen={setResumeDialogOpen}
                    reloadResumes={loadResumes}
                    setNewResumeId={setNewResumeId}
                    subjectUserId={subjectUserId}
                  />
                </div>

                <Collapsible
                  open={advancedOpen}
                  onOpenChange={setAdvancedOpen}
                  className="md:col-span-2"
                >
                  <CollapsibleTrigger
                    className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180"
                    data-testid="advanced-job-details-trigger"
                    type="button"
                  >
                    <span>Advanced job details</span>
                    <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {/* Job Title */}
                    <div>
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>
                              <OptionalLabel>Job Title</OptionalLabel>
                            </FormLabel>
                            <FormControl>
                              <Combobox
                                options={jobTitleOptions}
                                field={field}
                                creatable
                                onOptionsChange={setJobTitleOptions}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* Company */}
                    <div>
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>
                              <OptionalLabel>Company</OptionalLabel>
                            </FormLabel>
                            <FormControl>
                              <Combobox
                                options={companyOptions}
                                field={field}
                                creatable
                                onOptionsChange={setCompanyOptions}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* Location */}
                    <div>
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>
                              <OptionalLabel>Job Location</OptionalLabel>
                            </FormLabel>
                            <FormControl>
                              <Combobox
                                options={locationOptions}
                                field={field}
                                creatable
                                onOptionsChange={setLocationOptions}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* Job Type */}
                    <div>
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="mb-2">
                              <OptionalLabel>Job Type</OptionalLabel>
                            </FormLabel>
                            <RadioGroup
                              name="type"
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-y-1"
                            >
                              {Object.entries(JOB_TYPES).map(([key, value]) => (
                                <FormItem
                                  key={key}
                                  className="flex items-center space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <RadioGroupItem value={key} />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {value}
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* Job Source */}
                    <div>
                      <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>
                              <OptionalLabel>Job Source</OptionalLabel>
                            </FormLabel>
                            <Combobox
                              options={sourceOptions}
                              field={field}
                              creatable
                              onOptionsChange={setSourceOptions}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* Status */}
                    <div>
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem className="flex flex-col [&>button]:capitalize">
                            <FormLabel>
                              <OptionalLabel>Status</OptionalLabel>
                            </FormLabel>
                            <SelectFormCtrl
                              label="Job Status"
                              options={jobStatuses}
                              field={field}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* Salary Range */}
                    <div>
                      <FormField
                        control={form.control}
                        name="salaryRange"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>
                              <OptionalLabel>Salary Range</OptionalLabel>
                            </FormLabel>
                            <FormControl>
                              <SelectFormCtrl
                                label="Salary Range"
                                options={SALARY_RANGES}
                                field={field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* Add Skill Tags */}
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>
                              <OptionalLabel>Add Skill</OptionalLabel>
                            </FormLabel>
                            <FormControl>
                              <TagInput
                                availableTags={availableTags}
                                selectedTagIds={field.value ?? []}
                                onChange={(ids) => field.onChange(ids)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Job Description */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="jobDescription"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel id="job-description-label">
                          <OptionalLabel>Job Description</OptionalLabel>
                        </FormLabel>
                        <FormControl>
                          <TiptapEditor field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <NotesCollapsibleSection
                  jobId={editJob?.id}
                  subjectUserId={subjectUserId}
                  draftNotes={editJob ? undefined : draftNotes}
                  onDraftNotesChange={editJob ? undefined : setDraftNotes}
                />
                <div className="md:col-span-2">
                  <DialogFooter
                  // className="md:col-span
                  >
                    <div>
                      <Button
                        type="reset"
                        variant="outline"
                        className="mt-2 md:mt-0 w-full"
                        onClick={closeDialog}
                      >
                        Cancel
                      </Button>
                    </div>
                    <Button type="submit" data-testid="save-job-btn">
                      Save
                      {isPending && (
                        <Loader className="h-4 w-4 shrink-0 spinner" />
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              </form>
            </Form>
          </DialogContent>
        </DialogOverlay>
      </Dialog>
    </>
  );
}
