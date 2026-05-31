"use server";

import prisma from "@/lib/db";
import { resolveMeetingOwnerId } from "@/actions/meeting.actions";
import { handleError } from "@/lib/utils";
import { MeetingNoteFormSchema } from "@/models/meetingNote.schema";
import type { MeetingNoteResponse } from "@/models/meetingNote.model";
import { z } from "zod";

export const getNotesByMeetingId = async (
  meetingId: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await resolveMeetingOwnerId(meetingId);

    const notes = await prisma.meetingNote.findMany({
      where: { meetingId, userId: ownerId },
      orderBy: { createdAt: "desc" },
    });

    const data: MeetingNoteResponse[] = notes.map((note) => ({
      ...note,
      isEdited: note.updatedAt.getTime() - note.createdAt.getTime() > 1000,
    }));

    return { success: true, data };
  } catch (error) {
    return handleError(error, "Failed to fetch meeting notes.");
  }
};

export const addMeetingNote = async (
  data: z.infer<typeof MeetingNoteFormSchema>,
): Promise<any | undefined> => {
  try {
    const validated = MeetingNoteFormSchema.parse(data);
    const ownerId = await resolveMeetingOwnerId(validated.meetingId);

    const note = await prisma.meetingNote.create({
      data: {
        meetingId: validated.meetingId,
        userId: ownerId,
        content: validated.content,
      },
    });

    return { success: true, data: note };
  } catch (error) {
    return handleError(error, "Failed to add meeting note.");
  }
};

export const updateMeetingNote = async (
  data: z.infer<typeof MeetingNoteFormSchema>,
): Promise<any | undefined> => {
  try {
    const validated = MeetingNoteFormSchema.parse(data);
    if (!validated.id) {
      throw new Error("Note ID is required for update");
    }

    const ownerId = await resolveMeetingOwnerId(validated.meetingId);

    const note = await prisma.meetingNote.update({
      where: { id: validated.id, userId: ownerId },
      data: { content: validated.content },
    });

    return { success: true, data: note };
  } catch (error) {
    return handleError(error, "Failed to update meeting note.");
  }
};

export const deleteMeetingNote = async (
  noteId: string,
  meetingId: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await resolveMeetingOwnerId(meetingId);

    await prisma.meetingNote.delete({
      where: { id: noteId, userId: ownerId },
    });

    return { success: true };
  } catch (error) {
    return handleError(error, "Failed to delete meeting note.");
  }
};
