export interface MeetingNote {
  id: string;
  meetingId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingNoteResponse extends MeetingNote {
  isEdited: boolean;
}

export type MeetingNoteDisplay = Pick<
  MeetingNoteResponse,
  "id" | "content" | "createdAt" | "isEdited"
>;
