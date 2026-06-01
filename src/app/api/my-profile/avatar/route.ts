import { auth } from "@/auth";
import { uploadFile } from "@/actions/profile.actions";
import {
  buildAvatarUrl,
  validateAvatarFile,
} from "@/lib/avatar-file.utils";
import { getTimestampedFileName } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
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

    const validationError = validateAvatarFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const dataPath = process.env.NODE_ENV !== "production" ? "data" : "/data";
    const uploadDir = path.join(dataPath, "files", "avatars");
    const timestampedFileName = getTimestampedFileName(file.name);
    const filePath = path.join(uploadDir, timestampedFileName);

    await uploadFile(file, uploadDir, filePath);

    return NextResponse.json({
      success: true,
      url: buildAvatarUrl(filePath),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Avatar upload failed",
      },
      { status: 500 },
    );
  }
};

export const GET = async (req: NextRequest) => {
  const session = await auth();

  try {
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get("filePath");

    if (!filePath) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
    };
    const contentType = contentTypeMap[ext];
    if (!contentType) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const fileContent = fs.readFileSync(filePath);
    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "File download failed" },
      { status: 500 },
    );
  }
};
