"use server";
import prisma from "@/lib/db";
import { handleError } from "@/lib/utils";
import { NoteFormSchema } from "@/models/note.schema";
import { NoteResponse } from "@/models/note.model";
import { resolveJobOwnerId } from "@/actions/job.actions";
import { z } from "zod";

export const getNotesByJobId = async (
  jobId: string,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await resolveJobOwnerId(jobId, subjectUserId);

    const notes = await prisma.note.findMany({
      where: { jobId, userId: ownerId },
      orderBy: { createdAt: "desc" },
    });

    const data: NoteResponse[] = notes.map((note) => ({
      ...note,
      isEdited: note.updatedAt.getTime() - note.createdAt.getTime() > 1000,
    }));

    return { success: true, data };
  } catch (error) {
    const msg = "Failed to fetch notes.";
    return handleError(error, msg);
  }
};

export const addNote = async (
  data: z.infer<typeof NoteFormSchema>,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const validated = NoteFormSchema.parse(data);
    const ownerId = await resolveJobOwnerId(validated.jobId, subjectUserId);

    const note = await prisma.note.create({
      data: {
        jobId: validated.jobId,
        userId: ownerId,
        content: validated.content,
      },
    });

    return { success: true, data: note };
  } catch (error) {
    const msg = "Failed to add note.";
    return handleError(error, msg);
  }
};

export const updateNote = async (
  data: z.infer<typeof NoteFormSchema>,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const validated = NoteFormSchema.parse(data);
    if (!validated.id) {
      throw new Error("Note ID is required for update");
    }

    const ownerId = await resolveJobOwnerId(validated.jobId, subjectUserId);

    const note = await prisma.note.update({
      where: { id: validated.id, userId: ownerId },
      data: { content: validated.content },
    });

    return { success: true, data: note };
  } catch (error) {
    const msg = "Failed to update note.";
    return handleError(error, msg);
  }
};

export const deleteNote = async (
  noteId: string,
  jobId: string,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await resolveJobOwnerId(jobId, subjectUserId);

    await prisma.note.delete({
      where: { id: noteId, userId: ownerId },
    });

    return { success: true };
  } catch (error) {
    const msg = "Failed to delete note.";
    return handleError(error, msg);
  }
};
