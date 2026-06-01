"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { NoteDisplay, NoteResponse } from "@/models/note.model";
import {
  getNotesByJobId,
  deleteNote,
  addNote,
  updateNote,
} from "@/actions/note.actions";
import { NoteCard } from "./NoteCard";
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

export type DraftNote = {
  id: string;
  content: string;
  createdAt: Date;
};

type NotesCollapsibleSectionProps = {
  jobId?: string;
  subjectUserId?: string;
  draftNotes?: DraftNote[];
  onDraftNotesChange?: (notes: DraftNote[]) => void;
};

export function NotesCollapsibleSection({
  jobId,
  subjectUserId,
  draftNotes = [],
  onDraftNotesChange,
}: NotesCollapsibleSectionProps) {
  const isDraftMode = !jobId;
  const [notes, setNotes] = useState<NoteResponse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteResponse | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadNotes = useCallback(async () => {
    if (!jobId) return;
    const result = await getNotesByJobId(jobId, subjectUserId);
    if (result.success) {
      setNotes(result.data);
    }
  }, [jobId, subjectUserId]);

  useEffect(() => {
    if (!isDraftMode) {
      loadNotes();
    }
  }, [isDraftMode, loadNotes]);

  const displayedNotes: NoteResponse[] = isDraftMode
    ? draftNotes.map((note) => ({
        ...note,
        jobId: "",
        userId: "",
        updatedAt: note.createdAt,
        isEdited: false,
      }))
    : notes;

  const noteCount = displayedNotes.length;

  const handleAddNote = () => {
    setEditingNote(null);
    setEditorContent("");
    setIsAdding(true);
    setIsOpen(true);
  };

  const handleEdit = (note: NoteDisplay) => {
    const fullNote = displayedNotes.find((n) => n.id === note.id);
    if (!fullNote) return;
    setIsAdding(false);
    setEditingNote(fullNote);
    setEditorContent(note.content);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingNote(null);
    setEditorContent("");
  };

  const handleSave = () => {
    if (!editorContent.trim()) return;

    startTransition(async () => {
      if (isDraftMode) {
        if (!onDraftNotesChange) return;

        onDraftNotesChange(
          editingNote
            ? draftNotes.map((note) =>
                note.id === editingNote.id
                  ? { ...note, content: editorContent }
                  : note,
              )
            : [
                ...draftNotes,
                {
                  id: crypto.randomUUID(),
                  content: editorContent,
                  createdAt: new Date(),
                },
              ],
        );
        toast({
          variant: "success",
          description: `Note ${editingNote ? "updated" : "added"} successfully`,
        });
        handleCancel();
        return;
      }

      if (!jobId) return;

      const result = editingNote
        ? await updateNote(
            {
              id: editingNote.id,
              jobId,
              content: editorContent,
            },
            subjectUserId,
          )
        : await addNote({ jobId, content: editorContent }, subjectUserId);

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

    startTransition(async () => {
      if (isDraftMode) {
        onDraftNotesChange?.(
          draftNotes.filter((note) => note.id !== deleteConfirmId),
        );
        toast({
          variant: "success",
          description: "Note deleted successfully",
        });
        setDeleteConfirmId(null);
        return;
      }

      if (!jobId) return;

      const result = await deleteNote(deleteConfirmId, jobId, subjectUserId);
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
          {noteCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {noteCount}
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
        {isAdding && inlineEditor}
        {noteCount === 0 && !isAdding ? (
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
