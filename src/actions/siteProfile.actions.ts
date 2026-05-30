"use server";

import prisma from "@/lib/db";
import { decrypt, encrypt } from "@/lib/encryption";
import { handleError } from "@/lib/utils";
import { requireSubjectUserId } from "@/lib/admin-scope";
import {
  profileOwnerSelect,
  profileOwnerWhere,
  resolveProfileListScope,
} from "@/lib/profile-list-scope";
import { APP_CONSTANTS } from "@/lib/constants";

export const getSiteProfileList = async (
  page: number = 1,
  limit: number = APP_CONSTANTS.RECORDS_PER_PAGE,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const { isAllUsers, userId } = await resolveProfileListScope(subjectUserId);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.siteProfile.findMany({
        where: profileOwnerWhere(isAllUsers, userId),
        skip,
        take: limit,
        select: {
          id: true,
          profileId: true,
          siteUrl: true,
          accountName: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          ...(isAllUsers ? profileOwnerSelect : {}),
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.siteProfile.count({
        where: profileOwnerWhere(isAllUsers, userId),
      }),
    ]);
    return { data, total, success: true };
  } catch (error) {
    const msg = "Failed to get site profile list.";
    return handleError(error, msg);
  }
};

export const createSiteProfile = async (
  siteUrl: string,
  accountName: string,
  email: string,
  password: string,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);

    const normalizedUrl = siteUrl.trim().toLowerCase();
    const existing = await prisma.siteProfile.findFirst({
      where: {
        siteUrl: normalizedUrl,
        profile: {
          userId: ownerId,
        },
      },
    });

    if (existing) {
      throw new Error("A profile for this site already exists!");
    }

    const { encrypted, iv } = encrypt(password);

    const profile = await prisma.profile.findFirst({
      where: {
        userId: ownerId,
      },
    });

    const res = profile?.id
      ? await prisma.siteProfile.create({
          data: {
            profileId: profile.id,
            siteUrl: normalizedUrl,
            accountName,
            email,
            encryptedPassword: encrypted,
            iv,
          },
        })
      : await prisma.profile.create({
          data: {
            userId: ownerId,
            siteProfiles: {
              create: [
                {
                  siteUrl: normalizedUrl,
                  accountName,
                  email,
                  encryptedPassword: encrypted,
                  iv,
                },
              ],
            },
          },
          include: {
            siteProfiles: true,
          },
        });

    return { success: true, data: res };
  } catch (error) {
    const msg = "Failed to create site profile.";
    return handleError(error, msg);
  }
};

export const updateSiteProfile = async (
  id: string,
  siteUrl: string,
  accountName: string,
  email: string,
  password?: string,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);

    const normalizedUrl = siteUrl.trim().toLowerCase();
    const duplicate = await prisma.siteProfile.findFirst({
      where: {
        siteUrl: normalizedUrl,
        profile: {
          userId: ownerId,
        },
        NOT: { id },
      },
    });

    if (duplicate) {
      throw new Error("A profile for this site already exists!");
    }

    const data: {
      siteUrl: string;
      accountName: string;
      email: string;
      encryptedPassword?: string;
      iv?: string;
    } = {
      siteUrl: normalizedUrl,
      accountName,
      email,
    };

    if (password) {
      const { encrypted, iv } = encrypt(password);
      data.encryptedPassword = encrypted;
      data.iv = iv;
    }

    const res = await prisma.siteProfile.update({
      where: { id, profile: { userId: ownerId } },
      data,
    });

    return { success: true, data: res };
  } catch (error) {
    const msg = "Failed to update site profile.";
    return handleError(error, msg);
  }
};

export const deleteSiteProfileById = async (
  siteProfileId: string,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);

    await prisma.siteProfile.delete({
      where: { id: siteProfileId, profile: { userId: ownerId } },
    });

    return { success: true };
  } catch (error) {
    const msg = "Failed to delete site profile.";
    return handleError(error, msg);
  }
};

export const getSiteProfilePassword = async (
  siteProfileId: string,
  subjectUserId?: string,
): Promise<{ success: boolean; password?: string; message?: string }> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);

    const siteProfile = await prisma.siteProfile.findFirst({
      where: {
        id: siteProfileId,
        profile: {
          userId: ownerId,
        },
      },
      select: {
        encryptedPassword: true,
        iv: true,
      },
    });

    if (!siteProfile) {
      throw new Error("Site profile not found.");
    }

    const password = decrypt(siteProfile.encryptedPassword, siteProfile.iv);

    return { success: true, password };
  } catch (error) {
    const msg = "Failed to retrieve site profile password.";
    return handleError(error, msg) as {
      success: boolean;
      message: string;
    };
  }
};
