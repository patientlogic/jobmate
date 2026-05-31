import { auth } from "@/auth";
import { uploadFile } from "@/actions/profile.actions";
import {
  buildResumeDownloadUrl,
  validateMeetingResumeFile,
} from "@/lib/resume-file.utils";
import { getTimestampedFileName } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export const POST = async (req: NextRequest) => {
  const session = await auth();

  try {
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file?.name) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const validationError = validateMeetingResumeFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const dataPath = process.env.NODE_ENV !== "production" ? "data" : "/data";
    const uploadDir = path.join(dataPath, "files", "meeting-resumes");
    const timestampedFileName = getTimestampedFileName(file.name);
    const filePath = path.join(uploadDir, timestampedFileName);

    await uploadFile(file, uploadDir, filePath);

    const url = buildResumeDownloadUrl(filePath);

    return NextResponse.json({
      success: true,
      url,
      fileName: file.name,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Resume upload failed",
      },
      { status: 500 },
    );
  }
};
