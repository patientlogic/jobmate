import {
  getNotesByJobId,
  addNote,
  updateNote,
  deleteNote,
} from "@/actions/note.actions";
import { resolveJobOwnerId } from "@/actions/job.actions";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

vi.mock("@prisma/client", () => {
  const mPrismaClient = {
    note: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    job: {
      findFirst: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(function() { return mPrismaClient; }) };
});

vi.mock("@/actions/job.actions", () => ({
  resolveJobOwnerId: vi.fn(),
}));

describe("noteActions", () => {
  const mockUser = { id: "user-id" };
  const now = new Date();
  const mockNote = {
    id: "note-id",
    jobId: "job-id",
    userId: mockUser.id,
    content: "<p>Interview went well</p>",
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (resolveJobOwnerId as any).mockResolvedValue(mockUser.id);
  });

  describe("getNotesByJobId", () => {
    it("should return notes ordered newest-first", async () => {
      (prisma.note.findMany as any).mockResolvedValue([mockNote]);

      const result = await getNotesByJobId("job-id");

      expect(result).toEqual({
        success: true,
        data: [{ ...mockNote, isEdited: false }],
      });
      expect(prisma.note.findMany).toHaveBeenCalledWith({
        where: { jobId: "job-id", userId: mockUser.id },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should mark notes as edited when updatedAt differs from createdAt by more than 1 second", async () => {
      (prisma.job.findFirst as any).mockResolvedValue({ id: "job-id" });

      const createdAt = new Date("2026-01-01T10:00:00Z");
      const updatedAt = new Date("2026-01-01T10:05:00Z");
      const editedNote = { ...mockNote, createdAt, updatedAt };
      (prisma.note.findMany as any).mockResolvedValue([editedNote]);

      const result = await getNotesByJobId("job-id");

      expect(result.data[0].isEdited).toBe(true);
    });

    it("should not mark notes as edited when updatedAt is within 1 second of createdAt", async () => {
      const createdAt = new Date("2026-01-01T10:00:00.000Z");
      const updatedAt = new Date("2026-01-01T10:00:00.500Z");
      const freshNote = { ...mockNote, createdAt, updatedAt };
      (prisma.note.findMany as any).mockResolvedValue([freshNote]);

      const result = await getNotesByJobId("job-id");

      expect(result.data[0].isEdited).toBe(false);
    });

    it("should return empty array when no notes exist", async () => {
      (prisma.note.findMany as any).mockResolvedValue([]);

      const result = await getNotesByJobId("job-id");

      expect(result).toEqual({ success: true, data: [] });
    });

    it("should return error when job is not found", async () => {
      (resolveJobOwnerId as any).mockRejectedValue(new Error("Job not found"));

      const result = await getNotesByJobId("non-existent-job");

      expect(result).toEqual({ success: false, message: "Job not found" });
    });

    it("should return error when user is not authenticated", async () => {
      (resolveJobOwnerId as any).mockRejectedValue(new Error("Not authenticated"));

      const result = await getNotesByJobId("job-id");

      expect(result).toEqual({ success: false, message: "Not authenticated" });
    });

    it("should handle database errors", async () => {
      (resolveJobOwnerId as any).mockRejectedValue(new Error("Database error"));

      const result = await getNotesByJobId("job-id");

      expect(result).toEqual({ success: false, message: "Database error" });
    });
  });

  describe("addNote", () => {
    const noteData = { jobId: "job-id", content: "<p>New note</p>" };

    it("should create a note successfully", async () => {
      (prisma.note.create as any).mockResolvedValue(mockNote);

      const result = await addNote(noteData);

      expect(result).toEqual({ success: true, data: mockNote });
      expect(prisma.note.create).toHaveBeenCalledWith({
        data: {
          jobId: "job-id",
          userId: mockUser.id,
          content: "<p>New note</p>",
        },
      });
    });

    it("should verify job ownership before creating", async () => {
      (resolveJobOwnerId as any).mockRejectedValue(new Error("Job not found"));

      const result = await addNote(noteData);

      expect(result).toEqual({ success: false, message: "Job not found" });
      expect(prisma.note.create).not.toHaveBeenCalled();
    });

    it("should return error when user is not authenticated", async () => {
      (resolveJobOwnerId as any).mockRejectedValue(new Error("Not authenticated"));

      const result = await addNote(noteData);

      expect(result).toEqual({ success: false, message: "Not authenticated" });
    });

    it("should reject empty content via validation", async () => {
      const result = await addNote({ jobId: "job-id", content: "" });

      expect(result.success).toBe(false);
      expect(result.message).toBeTruthy();
    });

    it("should handle database errors", async () => {
      (prisma.note.create as any).mockRejectedValue(
        new Error("Database error")
      );

      const result = await addNote(noteData);

      expect(result).toEqual({ success: false, message: "Database error" });
    });
  });

  describe("updateNote", () => {
    const updateData = {
      id: "note-id",
      jobId: "job-id",
      content: "<p>Updated content</p>",
    };

    it("should update a note successfully", async () => {
      const updatedNote = { ...mockNote, content: updateData.content };
      (prisma.note.update as any).mockResolvedValue(updatedNote);

      const result = await updateNote(updateData);

      expect(result).toEqual({ success: true, data: updatedNote });
      expect(prisma.note.update).toHaveBeenCalledWith({
        where: { id: "note-id", userId: mockUser.id },
        data: { content: "<p>Updated content</p>" },
      });
    });

    it("should return error when note ID is missing", async () => {
      const result = await updateNote({ jobId: "job-id", content: "test" });

      expect(result).toEqual({
        success: false,
        message: "Note ID is required for update",
      });
    });

    it("should return error when user is not authenticated", async () => {
      (resolveJobOwnerId as any).mockRejectedValue(new Error("Not authenticated"));

      const result = await updateNote(updateData);

      expect(result).toEqual({ success: false, message: "Not authenticated" });
    });

    it("should handle database errors", async () => {
      (prisma.note.update as any).mockRejectedValue(
        new Error("Database error")
      );

      const result = await updateNote(updateData);

      expect(result).toEqual({ success: false, message: "Database error" });
    });
  });

  describe("deleteNote", () => {
    it("should delete a note successfully", async () => {
      (prisma.note.delete as any).mockResolvedValue(mockNote);

      const result = await deleteNote("note-id", "job-id");

      expect(result).toEqual({ success: true });
      expect(prisma.note.delete).toHaveBeenCalledWith({
        where: { id: "note-id", userId: mockUser.id },
      });
    });

    it("should return error when user is not authenticated", async () => {
      (resolveJobOwnerId as any).mockRejectedValue(new Error("Not authenticated"));

      const result = await deleteNote("note-id", "job-id");

      expect(result).toEqual({ success: false, message: "Not authenticated" });
    });

    it("should handle database errors", async () => {
      (prisma.note.delete as any).mockRejectedValue(
        new Error("Database error")
      );

      const result = await deleteNote("note-id", "job-id");

      expect(result).toEqual({ success: false, message: "Database error" });
    });

    it("should handle deleting non-existent note", async () => {
      (prisma.note.delete as any).mockRejectedValue(
        new Error("Record to delete does not exist.")
      );

      const result = await deleteNote("non-existent-id", "job-id");

      expect(result).toEqual({
        success: false,
        message: "Record to delete does not exist.",
      });
    });
  });
});
