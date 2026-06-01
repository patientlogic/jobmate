"use server";

import prisma from "@/lib/db";
import { handleError } from "@/lib/utils";
import type { UserProfile } from "@/models/userProfile.model";
import {
  ProfileExperienceFormSchema,
  UpdateUserProfileSchema,
} from "@/models/userProfileForm.schema";
import { getViewerContext } from "@/utils/user.utils";
import { z } from "zod";

function parseSkills(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string");
}

function mapUserProfile(
  profile: {
    id: string;
    userId: string;
    displayName: string;
    headline: string;
    bio: string | null;
    avatarUrl: string | null;
    skills: unknown;
    resumeUrl: string | null;
    resumeName: string | null;
    createdAt: Date;
    updatedAt: Date;
    experiences: Array<{
      id: string;
      userProfileId: string;
      title: string;
      company: string;
      location: string | null;
      startDate: Date;
      endDate: Date | null;
      isCurrent: boolean;
      description: string | null;
      sortOrder: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
  },
): UserProfile {
  return {
    ...profile,
    skills: parseSkills(profile.skills),
  };
}

async function getOwnerId(): Promise<string> {
  const viewer = await getViewerContext();
  if (!viewer) {
    throw new Error("Not authenticated");
  }
  return viewer.id;
}

async function ensureUserProfile(userId: string, displayNameFallback: string) {
  const existing = await prisma.userProfile.findUnique({
    where: { userId },
    include: {
      experiences: { orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }] },
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.userProfile.create({
    data: {
      userId,
      displayName: displayNameFallback,
    },
    include: {
      experiences: { orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }] },
    },
  });
}

export async function getMyUserProfile(): Promise<
  { success: true; data: UserProfile } | { success: false; message: string }
> {
  try {
    const viewer = await getViewerContext();
    if (!viewer) {
      throw new Error("Not authenticated");
    }

    const profile = await ensureUserProfile(viewer.id, viewer.name ?? "");
    return { success: true, data: mapUserProfile(profile) };
  } catch (error) {
    const result = handleError(error, "Failed to load profile.");
    return { success: false, message: result.message };
  }
}

export async function updateMyUserProfile(
  data: z.infer<typeof UpdateUserProfileSchema>,
): Promise<
  { success: true; data: UserProfile } | { success: false; message: string }
> {
  try {
    const viewer = await getViewerContext();
    if (!viewer) {
      throw new Error("Not authenticated");
    }

    const validated = UpdateUserProfileSchema.parse(data);
    await ensureUserProfile(viewer.id, viewer.name ?? "");

    const profile = await prisma.userProfile.update({
      where: { userId: viewer.id },
      data: {
        displayName: validated.displayName.trim(),
        headline: validated.headline?.trim() ?? "",
        bio: validated.bio?.trim() || null,
        skills: validated.skills ?? [],
        avatarUrl: validated.avatarUrl ?? null,
        resumeUrl: validated.resumeUrl ?? null,
        resumeName: validated.resumeName ?? null,
      },
      include: {
        experiences: { orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }] },
      },
    });

    return { success: true, data: mapUserProfile(profile) };
  } catch (error) {
    const result = handleError(error, "Failed to update profile.");
    return { success: false, message: result.message };
  }
}

export async function saveProfileExperience(
  data: z.infer<typeof ProfileExperienceFormSchema>,
): Promise<
  { success: true; data: UserProfile } | { success: false; message: string }
> {
  try {
    const userId = await getOwnerId();
    const validated = ProfileExperienceFormSchema.parse(data);
    const profile = await ensureUserProfile(userId, "");

    const experienceData = {
      title: validated.title.trim(),
      company: validated.company.trim(),
      location: validated.location?.trim() || null,
      startDate: validated.startDate,
      endDate: validated.isCurrent ? null : validated.endDate ?? null,
      isCurrent: validated.isCurrent,
      description: validated.description?.trim() || null,
    };

    if (validated.id) {
      const existing = await prisma.profileExperience.findFirst({
        where: { id: validated.id, userProfileId: profile.id },
      });
      if (!existing) {
        throw new Error("Experience not found");
      }
      await prisma.profileExperience.update({
        where: { id: validated.id },
        data: experienceData,
      });
    } else {
      const count = await prisma.profileExperience.count({
        where: { userProfileId: profile.id },
      });
      await prisma.profileExperience.create({
        data: {
          ...experienceData,
          userProfileId: profile.id,
          sortOrder: count,
        },
      });
    }

    const updated = await prisma.userProfile.findUniqueOrThrow({
      where: { id: profile.id },
      include: {
        experiences: { orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }] },
      },
    });

    return { success: true, data: mapUserProfile(updated) };
  } catch (error) {
    const result = handleError(error, "Failed to save experience.");
    return { success: false, message: result.message };
  }
}

export async function deleteProfileExperience(
  experienceId: string,
): Promise<
  { success: true; data: UserProfile } | { success: false; message: string }
> {
  try {
    const userId = await getOwnerId();
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new Error("Profile not found");
    }

    const existing = await prisma.profileExperience.findFirst({
      where: { id: experienceId, userProfileId: profile.id },
    });
    if (!existing) {
      throw new Error("Experience not found");
    }

    await prisma.profileExperience.delete({ where: { id: experienceId } });

    const updated = await prisma.userProfile.findUniqueOrThrow({
      where: { id: profile.id },
      include: {
        experiences: { orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }] },
      },
    });

    return { success: true, data: mapUserProfile(updated) };
  } catch (error) {
    const result = handleError(error, "Failed to delete experience.");
    return { success: false, message: result.message };
  }
}
