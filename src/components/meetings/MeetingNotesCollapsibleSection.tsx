"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { MeetingNoteDisplay, MeetingNoteResponse } from "@/models/meetingNote.model";
import {
  addMeetingNote,
  deleteMeetingNote,
  getNotesByMeetingId,
  updateMeetingNote,
} from "@/actions/meetingNote.actions";
import { NoteCard } from "../myjobs/NoteCard";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ChevronDown, Loader, PlusCircle, StickyNote } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { toast } from "../ui/use-toast";
import TiptapEditor from "../TiptapEditor";

type MeetingNotesCollapsibleSectionProps = {
  meetingId?: string;
  draftNotes?: MeetingNoteDisplay[];
  onDraftNotesChange?: (notes: MeetingNoteDisplay[]) => void;
};

export function MeetingNotesCollapsibleSection({
  meetingId,
  draftNotes = [],
  onDraftNotesChange,
}: MeetingNotesCollapsibleSectionProps) {
  const isDraftMode = !meetingId;
  const [notes, setNotes] = useState<MeetingNoteResponse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<MeetingNoteDisplay | null>(
    null,
  );
  const [isAdding, setIsAdding] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const displayedNotes: MeetingNoteDisplay[] = isDraftMode ? draftNotes : notes;

  const loadNotes = useCallback(async () => {
    if (!meetingId) return;

    const result = await getNotesByMeetingId(meetingId);
    if (result.success) {
      setNotes(result.data);
    }
  }, [meetingId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleAddNote = () => {
    setEditingNote(null);
    setEditorContent("");
    setIsAdding(true);
    setIsOpen(true);
  };

  const handleEdit = (note: MeetingNoteDisplay) => {
    setIsAdding(false);
    setEditingNote(note);
    setEditorContent(note.content);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingNote(null);
    setEditorContent("");
  };

  const handleSave = () => {
    if (!editorContent.trim()) return;

    if (isDraftMode) {
      if (!onDraftNotesChange) return;

      if (editingNote) {
        onDraftNotesChange(
          draftNotes.map((note) =>
            note.id === editingNote.id
              ? { ...note, content: editorContent, isEdited: true }
              : note,
          ),
        );
      } else {
        onDraftNotesChange([
          {
            id: crypto.randomUUID(),
            content: editorContent,
            createdAt: new Date(),
            isEdited: false,
          },
          ...draftNotes,
        ]);
      }

      handleCancel();
      return;
    }

    if (!meetingId) return;

    startTransition(async () => {
      const result = editingNote
        ? await updateMeetingNote({
            id: editingNote.id,
            meetingId,
            content: editorContent,
          })
        : await addMeetingNote({ meetingId, content: editorContent });

      if (result.success) {
        toast({
          variant: "success",
          description: `Note ${editingNote ? "updated" : "added"} successfully`,
        });
        handleCancel();
        loadNotes();
      } else {
        toast({
          variant: "destructive",
          title: "Error!",
          description: result.message,
        });
      }
    });
  };

  const handleDeleteClick = (noteId: string) => {
    setDeleteConfirmId(noteId);
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmId) return;

    if (isDraftMode) {
      onDraftNotesChange?.(
        draftNotes.filter((note) => note.id !== deleteConfirmId),
      );
      setDeleteConfirmId(null);
      return;
    }

    if (!meetingId) return;

    startTransition(async () => {
      const result = await deleteMeetingNote(deleteConfirmId, meetingId);
      if (result.success) {
        toast({
          variant: "success",
          description: "Note deleted successfully",
        });
        setDeleteConfirmId(null);
        loadNotes();
      } else {
        toast({
          variant: "destructive",
          title: "Error!",
          description: result.message,
        });
      }
    });
  };

  const inlineEditor = (
    <div className="border rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium">
        {editingNote ? "Edit Note" : "Add Note"}
      </p>
      <TiptapEditor
        field={
          {
            value: editorContent,
            onChange: (val: string) => setEditorContent(val),
            onBlur: () => {},
            name: "content" as const,
            ref: () => {},
          } as any
        }
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={isPending || !editorContent.trim()}
        >
          Save
          {isPending && <Loader className="ml-2 h-4 w-4 shrink-0 spinner" />}
        </Button>
      </div>
    </div>
  );

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="md:col-span-2"
    >
      <div className="flex items-center gap-2">
        <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-80">
          <StickyNote className="h-4 w-4" />
          <span className="text-sm font-medium">Notes</span>
          {displayedNotes.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {displayedNotes.length}
            </Badge>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>
        <Button
          variant="outline"
          size="sm"
          type="button"
          className="h-7 gap-1 ml-auto"
          onClick={handleAddNote}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          New Note
        </Button>
      </div>
      <CollapsibleContent className="mt-3 space-y-3">
        {isDraftMode && (
          <p className="text-xs text-muted-foreground">
            Notes added here will be saved when you create the meeting.
          </p>
        )}
        {isAdding && inlineEditor}
        {displayedNotes.length === 0 && !isAdding ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          displayedNotes.map((note) =>
            editingNote?.id === note.id ? (
              <div key={note.id}>{inlineEditor}</div>
            ) : deleteConfirmId === note.id ? (
              <div
                key={note.id}
                className="border border-destructive rounded-lg p-4 space-y-3"
              >
                <p className="text-sm font-medium">
                  Are you sure you want to delete this note?
                </p>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmId(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteConfirm}
                    disabled={isPending}
                  >
                    Delete
                    {isPending && (
                      <Loader className="ml-2 h-4 w-4 shrink-0 spinner" />
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ),
          )
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
