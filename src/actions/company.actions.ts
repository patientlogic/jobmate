"use server";

import prisma from "@/lib/db";
import { handleError } from "@/lib/utils";
import { AddCompanyFormSchema } from "@/models/addCompanyForm.schema";
import { getCurrentUser, getViewerContext } from "@/utils/user.utils";
import { APP_CONSTANTS } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { z } from "zod";

type CompanyListOptions = {
  globalCatalog?: boolean;
};

function assertAdmin(role: UserRole): void {
  if (role !== UserRole.ADMIN) {
    throw new Error("Forbidden");
  }
}

function canManageCompany(
  viewer: { id: string; role: UserRole },
  createdBy: string,
  options?: CompanyListOptions,
): boolean {
  if (options?.globalCatalog && viewer.role === UserRole.ADMIN) {
    return true;
  }
  return createdBy === viewer.id;
}

type CompanyRow = {
  id: string;
  label: string;
  value: string;
  createdBy: string;
  logoUrl?: string | null;
  isGlobal: boolean;
};

function dedupeCompaniesByValue(companies: CompanyRow[]): CompanyRow[] {
  const byValue = new Map<string, CompanyRow>();

  for (const company of companies) {
    const existing = byValue.get(company.value);
    if (!existing || (company.isGlobal && !existing.isGlobal)) {
      byValue.set(company.value, company);
    }
  }

  return Array.from(byValue.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

async function fetchAllCompanies(): Promise<CompanyRow[]> {
  const companies = await prisma.company.findMany({
    orderBy: {
      label: "asc",
    },
  });

  return dedupeCompaniesByValue(companies);
}

export const getCompanyList = async (
  page: number = 1,
  limit: number = APP_CONSTANTS.RECORDS_PER_PAGE,
  countBy?: string,
  options?: CompanyListOptions,
): Promise<any | undefined> => {
  try {
    const viewer = await getViewerContext();

    if (!viewer) {
      throw new Error("Not authenticated");
    }

    if (options?.globalCatalog) {
      assertAdmin(viewer.role);
    }

    const skip = (page - 1) * limit;

    const [data, total, rejectedCounts] = await Promise.all([
      prisma.company.findMany({
        skip,
        take: limit,
        ...(countBy
          ? {
              select: {
                id: true,
                label: true,
                value: true,
                logoUrl: true,
                isGlobal: true,
                createdBy: true,
                _count: {
                  select: {
                    jobsApplied: {
                      where: {
                        applied: true,
                      },
                    },
                  },
                },
              },
            }
          : {}),
        orderBy: {
          jobsApplied: {
            _count: "desc",
          },
        },
      }),
      prisma.company.count(),
      countBy
        ? prisma.job.groupBy({
            by: ["companyId"],
            where: {
              Status: { value: "rejected" },
            },
            _count: { id: true },
          })
        : Promise.resolve([]),
    ]);

    const rejectedMap = new Map(
      (rejectedCounts as { companyId: string; _count: { id: number } }[]).map(
        (r) => [r.companyId, r._count.id],
      ),
    );

    const dataWithRejected = countBy
      ? (data as any[]).map((company) => ({
          ...company,
          _count: {
            ...(company._count ?? {}),
            jobsRejected: rejectedMap.get(company.id) ?? 0,
          },
        }))
      : data;

    return { data: dataWithRejected, total };
  } catch (error) {
    const msg = "Failed to fetch company list. ";
    return handleError(error, msg);
  }
};

export const getAllCompanies = async (): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    return await fetchAllCompanies();
  } catch (error) {
    const msg = "Failed to fetch all companies. ";
    return handleError(error, msg);
  }
};

const isValidImageUrl = (url: string): boolean => {
  if (!url) return true;
  if (url.startsWith("/")) return true;
  try {
    const urlObj = new URL(url);
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const addCompany = async (
  data: z.infer<typeof AddCompanyFormSchema>,
  options?: CompanyListOptions,
): Promise<any | undefined> => {
  try {
    const viewer = await getViewerContext();

    if (!viewer) {
      throw new Error("Not authenticated");
    }

    if (options?.globalCatalog) {
      assertAdmin(viewer.role);
    }

    const { company, logoUrl } = data;

    if (logoUrl && !isValidImageUrl(logoUrl)) {
      throw new Error(
        "Invalid logo URL. Only http and https protocols are allowed.",
      );
    }

    const value = company.trim().toLowerCase();

    const companyExists = await prisma.company.findFirst({
      where: { value },
      orderBy: [{ isGlobal: "desc" }, { label: "asc" }],
    });

    if (companyExists) {
      return { success: true, data: companyExists };
    }

    const res = await prisma.company.create({
      data: {
        createdBy: viewer.id,
        value,
        label: company,
        logoUrl,
        isGlobal: options?.globalCatalog ?? false,
      },
    });
    revalidatePath("/dashboard/jobs", "page");
    revalidatePath("/dashboard/admin", "page");
    return { success: true, data: res };
  } catch (error) {
    const msg = "Failed to create company.";
    return handleError(error, msg);
  }
};

export const updateCompany = async (
  data: z.infer<typeof AddCompanyFormSchema>,
  options?: CompanyListOptions,
): Promise<any | undefined> => {
  try {
    const viewer = await getViewerContext();

    if (!viewer) {
      throw new Error("Not authenticated");
    }

    const { id, company, logoUrl } = data;

    if (!id) {
      throw new Error("Company id is required");
    }

    if (logoUrl && !isValidImageUrl(logoUrl)) {
      throw new Error(
        "Invalid logo URL. Only http and https protocols are allowed.",
      );
    }

    const existing = await prisma.company.findUnique({
      where: { id },
      select: { isGlobal: true, createdBy: true },
    });

    if (!existing) {
      throw new Error("Company not found");
    }

    if (!canManageCompany(viewer, existing.createdBy, options)) {
      throw new Error("Forbidden");
    }

    const value = company.trim().toLowerCase();

    const companyExists = await prisma.company.findFirst({
      where: {
        value,
        id: { not: id },
      },
    });

    if (companyExists) {
      throw new Error("Company already exists!");
    }

    const res = await prisma.company.update({
      where: {
        id,
      },
      data: {
        value,
        label: company,
        logoUrl,
      },
    });

    revalidatePath("/dashboard/jobs", "page");
    revalidatePath("/dashboard/admin", "page");
    return { success: true, data: res };
  } catch (error) {
    const msg = "Failed to update company.";
    return handleError(error, msg);
  }
};

export const getCompanyById = async (
  companyId: string,
  options?: CompanyListOptions,
): Promise<any | undefined> => {
  try {
    if (!companyId) {
      throw new Error("Please provide company id");
    }
    const viewer = await getViewerContext();

    if (!viewer) {
      throw new Error("Not authenticated");
    }

    if (options?.globalCatalog) {
      assertAdmin(viewer.role);
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    return company;
  } catch (error) {
    const msg = "Failed to fetch company by Id. ";
    console.error(msg);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
  }
};

export const deleteCompanyById = async (
  companyId: string,
  options?: CompanyListOptions,
): Promise<any | undefined> => {
  try {
    const viewer = await getViewerContext();

    if (!viewer) {
      throw new Error("Not authenticated");
    }

    const existing = await prisma.company.findUnique({
      where: { id: companyId },
      select: { isGlobal: true, createdBy: true },
    });

    if (!existing) {
      throw new Error("Company not found");
    }

    if (!canManageCompany(viewer, existing.createdBy, options)) {
      throw new Error("Forbidden");
    }

    const experiences = await prisma.workExperience.count({
      where: {
        companyId,
      },
    });
    if (experiences > 0) {
      throw new Error(
        `Company cannot be deleted due to its use in experience section of one of the resume! `,
      );
    }
    const jobs = await prisma.job.count({
      where: {
        companyId,
      },
    });

    if (jobs > 0) {
      throw new Error(
        `Company cannot be deleted due to ${jobs} number of associated jobs! `,
      );
    }

    const res = await prisma.company.delete({
      where: {
        id: companyId,
      },
    });
    revalidatePath("/dashboard/jobs", "page");
    revalidatePath("/dashboard/admin", "page");
    return { res, success: true };
  } catch (error) {
    const msg = "Failed to delete company.";
    return handleError(error, msg);
  }
};
