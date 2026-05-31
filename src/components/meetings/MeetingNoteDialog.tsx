"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MeetingNoteFormSchema } from "@/models/meetingNote.schema";
import type { MeetingNoteResponse } from "@/models/meetingNote.model";
import { addMeetingNote, updateMeetingNote } from "@/actions/meetingNote.actions";
import { toast } from "../ui/use-toast";
import { useEffect, useTransition } from "react";
import { Loader } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import TiptapEditor from "../TiptapEditor";

type MeetingNoteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  editNote?: MeetingNoteResponse | null;
  onSaved: () => void;
};

export function MeetingNoteDialog({
  open,
  onOpenChange,
  meetingId,
  editNote,
  onSaved,
}: MeetingNoteDialogProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof MeetingNoteFormSchema>>({
    resolver: zodResolver(MeetingNoteFormSchema) as any,
    defaultValues: {
      meetingId,
      content: "",
    },
  });

  useEffect(() => {
    if (editNote) {
      form.reset({ id: editNote.id, meetingId, content: editNote.content });
    } else {
      form.reset({ meetingId, content: "" });
    }
  }, [editNote, meetingId, form, open]);

  function onSubmit(data: z.infer<typeof MeetingNoteFormSchema>) {
    startTransition(async () => {
      const result = editNote
        ? await updateMeetingNote(data)
        : await addMeetingNote(data);

      if (result.success) {
        toast({
          variant: "success",
          description: `Note ${editNote ? "updated" : "added"} successfully`,
        });
        form.reset({ meetingId, content: "" });
        onOpenChange(false);
        onSaved();
      } else {
        toast({
          variant: "destructive",
          title: "Error!",
          description: result.message,
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editNote ? "Edit Note" : "Add Note"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <TiptapEditor field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                Save
                {isPending && (
                  <Loader className="ml-2 h-4 w-4 shrink-0 spinner" />
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
