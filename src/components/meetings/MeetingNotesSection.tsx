"use client";

import { useCallback, useEffect, useState } from "react";
import type { MeetingNoteDisplay, MeetingNoteResponse } from "@/models/meetingNote.model";
import {
  deleteMeetingNote,
  getNotesByMeetingId,
} from "@/actions/meetingNote.actions";
import { NoteCard } from "../myjobs/NoteCard";
import { MeetingNoteDialog } from "./MeetingNoteDialog";
import { DeleteAlertDialog } from "../DeleteAlertDialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ChevronDown, PlusCircle, StickyNote } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { toast } from "../ui/use-toast";

type MeetingNotesSectionProps = {
  meetingId: string;
};

export function MeetingNotesSection({ meetingId }: MeetingNotesSectionProps) {
  const [notes, setNotes] = useState<MeetingNoteResponse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editNote, setEditNote] = useState<MeetingNoteResponse | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState("");

  const loadNotes = useCallback(async () => {
    const result = await getNotesByMeetingId(meetingId);
    if (result.success) {
      setNotes(result.data);
      if (result.data.length > 0) setIsOpen(true);
    }
  }, [meetingId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleEdit = (note: MeetingNoteDisplay) => {
    const fullNote = notes.find((n) => n.id === note.id);
    if (!fullNote) return;
    setEditNote(fullNote);
    setDialogOpen(true);
  };

  const handleDeleteClick = (noteId: string) => {
    setNoteIdToDelete(noteId);
    setDeleteAlertOpen(true);
  };

  const handleDelete = async () => {
    const result = await deleteMeetingNote(noteIdToDelete, meetingId);
    if (result.success) {
      toast({
        variant: "success",
        description: "Note deleted successfully",
      });
      loadNotes();
    } else {
      toast({
        variant: "destructive",
        title: "Error!",
        description: result.message,
      });
    }
  };

  const handleAddNote = () => {
    setEditNote(null);
    setDialogOpen(true);
  };

  const handleSaved = () => {
    setEditNote(null);
    loadNotes();
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="sm:col-span-2">
        <div className="flex items-center justify-between">
          <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-80">
            <StickyNote className="h-4 w-4" />
            <span className="font-medium">Notes</span>
            {notes.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {notes.length}
              </Badge>
            )}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1"
            onClick={handleAddNote}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            New Note
          </Button>
        </div>
        <CollapsibleContent className="mt-3 space-y-3">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))
          )}
        </CollapsibleContent>
      </Collapsible>

      <MeetingNoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        meetingId={meetingId}
        editNote={editNote}
        onSaved={handleSaved}
      />
      <DeleteAlertDialog
        pageTitle="note"
        open={deleteAlertOpen}
        onOpenChange={setDeleteAlertOpen}
        onDelete={handleDelete}
      />
    </>
  );
}
