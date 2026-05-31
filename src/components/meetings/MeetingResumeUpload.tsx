"use client";

import { FileText, Loader, Upload, X } from "lucide-react";
import { useCallback, useRef, useState, useTransition } from "react";

import {
  getResumeLabelFromUrl,
  validateMeetingResumeFile,
} from "@/lib/resume-file.utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { MeetingResumeOption } from "@/models/meeting.model";
import { toast } from "@/components/ui/use-toast";

type MeetingResumeUploadProps = {
  value?: string;
  onChange: (url: string) => void;
  resumeOptions?: MeetingResumeOption[];
  selectedJobId?: string;
};

export function MeetingResumeUpload({
  value = "",
  onChange,
  resumeOptions = [],
  selectedJobId,
}: MeetingResumeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();

  const uploadFile = useCallback(
    (file: File) => {
      if (value) {
        toast({
          variant: "destructive",
          title: "One resume only",
          description: "Remove the current resume before uploading another.",
        });
        return;
      }

      const validationError = validateMeetingResumeFile(file);
      if (validationError) {
        toast({
          variant: "destructive",
          title: "Invalid file",
          description: validationError,
        });
        return;
      }

      startTransition(async () => {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const response = await fetch("/api/meetings/resume", {
            method: "POST",
            body: formData,
          });
          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error ?? "Upload failed");
          }

          onChange(result.url);
          toast({
            variant: "success",
            description: "Resume uploaded successfully",
          });
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Upload failed",
            description:
              error instanceof Error ? error.message : "Could not upload resume",
          });
        }
      });
    },
    [onChange, value],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile],
  );

  const selectedLabel = value ? getResumeLabelFromUrl(value) : null;

  const hasResume = Boolean(value);

  return (
    <div className="space-y-3">
      {hasResume ? (
        <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">{selectedLabel}</span>
          </a>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onChange("")}
            aria-label="Remove resume"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleFiles(event.dataTransfer.files);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4 py-6 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30",
              isPending && "pointer-events-none opacity-60",
            )}
          >
            {isPending ? (
              <Loader className="mb-2 h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            )}
            <p className="text-sm font-medium">
              {isPending ? "Uploading..." : "Click or drag a resume to upload"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF or Word, up to 5MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(event) => {
                handleFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </div>

          {selectedJobId ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Resume used for this application
              </p>
              {resumeOptions.length > 0 ? (
                <ul className="space-y-1 rounded-md border p-2">
                  {resumeOptions.map((resume) => (
                    <li key={resume.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                        onClick={() => onChange(resume.url)}
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">
                          {resume.label}
                        </span>
                        <a
                          href={resume.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-xs text-primary underline-offset-4 hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Open
                        </a>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No resume linked to this application.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select an applied job to see the resume used for that application.
            </p>
          )}
        </>
      )}
    </div>
  );
}
