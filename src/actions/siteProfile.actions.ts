"use server";

import prisma from "@/lib/db";
import { decrypt, encrypt } from "@/lib/encryption";
import { handleError } from "@/lib/utils";
import { getCurrentUser } from "@/utils/user.utils";
import { APP_CONSTANTS } from "@/lib/constants";

export const getSiteProfileList = async (
  page: number = 1,
  limit: number = APP_CONSTANTS.RECORDS_PER_PAGE,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.siteProfile.findMany({
        where: {
          profile: {
            userId: user.id,
          },
        },
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
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.siteProfile.count({
        where: {
          profile: {
            userId: user.id,
          },
        },
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
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const normalizedUrl = siteUrl.trim().toLowerCase();
    const existing = await prisma.siteProfile.findFirst({
      where: {
        siteUrl: normalizedUrl,
        profile: {
          userId: user.id,
        },
      },
    });

    if (existing) {
      throw new Error("A profile for this site already exists!");
    }

    const { encrypted, iv } = encrypt(password);

    const profile = await prisma.profile.findFirst({
      where: {
        userId: user.id,
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
            userId: user.id,
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
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const normalizedUrl = siteUrl.trim().toLowerCase();
    const duplicate = await prisma.siteProfile.findFirst({
      where: {
        siteUrl: normalizedUrl,
        profile: {
          userId: user.id,
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
      where: { id, profile: { userId: user.id } },
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
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    await prisma.siteProfile.delete({
      where: { id: siteProfileId, profile: { userId: user.id } },
    });

    return { success: true };
  } catch (error) {
    const msg = "Failed to delete site profile.";
    return handleError(error, msg);
  }
};

export const getSiteProfilePassword = async (
  siteProfileId: string,
): Promise<{ success: boolean; password?: string; message?: string }> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const siteProfile = await prisma.siteProfile.findFirst({
      where: {
        id: siteProfileId,
        profile: {
          userId: user.id,
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
