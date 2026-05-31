import { z } from "zod";

export const MeetingNoteFormSchema = z.object({
  id: z.string().optional(),
  meetingId: z.string({ error: "Meeting ID is required." }),
  content: z
    .string({ error: "Content is required." })
    .min(1, { message: "Content cannot be empty." }),
});
