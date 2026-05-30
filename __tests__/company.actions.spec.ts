import {
  addCompany,
  deleteCompanyById,
  getAllCompanies,
  getCompanyById,
  getCompanyList,
  updateCompany,
} from "@/actions/company.actions";
import { getCurrentUser, getViewerContext } from "@/utils/user.utils";
import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mock the Prisma Client
vi.mock("@prisma/client", () => {
  const mPrismaClient = {
    company: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workExperience: {
      count: vi.fn(),
    },
    job: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(function () {
      return mPrismaClient;
    }),
  };
});

vi.mock("@/utils/user.utils", () => ({
  getCurrentUser: vi.fn(),
  getViewerContext: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Company Actions", () => {
  const mockUser = { id: "user-id" };
  const mockViewer = {
    id: "user-id",
    name: "User",
    email: "user@test.com",
    role: "USER",
  };
  const mockAdmin = {
    id: "admin-id",
    name: "Admin",
    email: "admin@test.com",
    role: "ADMIN",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe("getCompanyList", () => {
    it("should return company list for authenticated user", async () => {
      (getViewerContext as any).mockResolvedValue(mockViewer);
      const mockData = [
        {
          id: "company-id",
          label: "Company 1",
          value: "company1",
          logoUrl: "logo.png",
        },
      ];
      const mockTotal = 1;

      (prisma.company.findMany as any).mockResolvedValue(mockData);
      (prisma.company.count as any).mockResolvedValue(mockTotal);

      const result = await getCompanyList(1, 10);

      expect(result).toEqual({ data: mockData, total: mockTotal });
      expect(prisma.company.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { jobsApplied: { _count: "desc" } },
      });
      expect(prisma.company.count).toHaveBeenCalledWith();
    });

    it("should throw an error for unauthenticated user", async () => {
      (getViewerContext as any).mockResolvedValue(null);

      await expect(getCompanyList(1, 10)).resolves.toStrictEqual({
        success: false,
        message: "Not authenticated",
      });

      expect(prisma.company.findMany).not.toHaveBeenCalled();
      expect(prisma.company.count).not.toHaveBeenCalled();
    });

    it("should filter by status when countBy is provided", async () => {
      (getViewerContext as any).mockResolvedValue(mockViewer);
      const mockData = [
        {
          id: "company-id",
          label: "Company 1",
          value: "company1",
          logoUrl: "logo.png",
        },
      ];
      const mockTotal = 1;

      (prisma.company.findMany as any).mockResolvedValue(mockData);
      (prisma.company.count as any).mockResolvedValue(mockTotal);
      (prisma.job.groupBy as any).mockResolvedValue([]);

      const result = await getCompanyList(1, 10, "applied");

      const expectedData = mockData.map((c) => ({
        ...c,
        _count: { jobsRejected: 0 },
      }));
      expect(result).toEqual({ data: expectedData, total: mockTotal });
      expect(prisma.company.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
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
        orderBy: { jobsApplied: { _count: "desc" } },
      });
      expect(prisma.company.count).toHaveBeenCalledWith();
    });

    it("should handle errors", async () => {
      (getViewerContext as any).mockRejectedValue(new Error("Database error"));

      await expect(getCompanyList(1, 10)).resolves.toStrictEqual({
        success: false,
        message: "Database error",
      });

      expect(prisma.company.findMany).not.toHaveBeenCalled();
      expect(prisma.company.count).not.toHaveBeenCalled();
    });
  });

  describe("getAllCompanies", () => {
    it("should return all companies for authenticated user", async () => {
      (getCurrentUser as any).mockResolvedValue(mockUser);
      const mockCompanies = [
        { id: "company1", name: "Company 1" },
        { id: "company2", name: "Company 2" },
      ];

      (prisma.company.findMany as any).mockResolvedValue(mockCompanies);

      const result = await getAllCompanies();

      expect(result).toEqual(mockCompanies);
      expect(prisma.company.findMany).toHaveBeenCalledWith({
        orderBy: {
          label: "asc",
        },
      });
    });

    it("should throw an error for unauthenticated user", async () => {
      (getCurrentUser as any).mockResolvedValue(null);

      await expect(getAllCompanies()).resolves.toStrictEqual({
        success: false,
        message: "Not authenticated",
      });

      expect(prisma.company.findMany).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors", async () => {
      (getCurrentUser as any).mockResolvedValue(mockUser);
      (prisma.company.findMany as any).mockRejectedValue(
        new Error("Unexpected error"),
      );

      const result = await getAllCompanies();

      expect(result).toEqual({ success: false, message: "Unexpected error" });
      expect(prisma.company.findMany).toHaveBeenCalledWith({
        orderBy: {
          label: "asc",
        },
      });
    });
  });

  describe("addCompany", () => {
    const validData = {
      company: "New Company",
      logoUrl: "http://example.com/logo.png",
    };

    it("should create a new company successfully", async () => {
      (getViewerContext as any).mockResolvedValue(mockViewer);
      (prisma.company.findFirst as any).mockResolvedValue(null);
      const mockCompany = {
        id: "company-id",
        label: "New Company",
        value: "new company",
        logoUrl: "http://example.com/logo.png",
        createdBy: mockUser.id,
      };
      (prisma.company.create as any).mockResolvedValue(mockCompany);
      (revalidatePath as any).mockResolvedValue(undefined);

      const result = await addCompany(validData);

      expect(result).toEqual({ success: true, data: mockCompany });
      expect(prisma.company.findFirst).toHaveBeenCalledWith({
        where: { value: "new company" },
        orderBy: [{ isGlobal: "desc" }, { label: "asc" }],
      });
      expect(prisma.company.create).toHaveBeenCalledWith({
        data: {
          createdBy: mockUser.id,
          value: "new company",
          label: "New Company",
          logoUrl: "http://example.com/logo.png",
          isGlobal: false,
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard/myjobs", "page");
    });

    it("should create a global company for admin catalog", async () => {
      (getViewerContext as any).mockResolvedValue(mockAdmin);
      (prisma.company.findFirst as any).mockResolvedValue(null);
      (prisma.company.create as any).mockResolvedValue({
        id: "global-company-id",
        isGlobal: true,
      });
      (revalidatePath as any).mockResolvedValue(undefined);

      const result = await addCompany(validData, { globalCatalog: true });

      expect(result.success).toBe(true);
      expect(prisma.company.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isGlobal: true,
          createdBy: mockAdmin.id,
        }),
      });
    });

    it("should return an error if the user is not authenticated", async () => {
      (getViewerContext as any).mockResolvedValue(null);

      const result = await addCompany(validData);

      expect(result).toEqual({ success: false, message: "Not authenticated" });
      expect(prisma.company.findFirst).not.toHaveBeenCalled();
      expect(prisma.company.create).not.toHaveBeenCalled();
    });

    it("should return existing company when duplicate value exists", async () => {
      (getViewerContext as any).mockResolvedValue(mockViewer);
      const mockExistingCompany = {
        id: "existing-company-id",
        ...validData,
        value: "new company",
        createdBy: "other-user",
      };
      (prisma.company.findFirst as any).mockResolvedValue(mockExistingCompany);

      const result = await addCompany(validData);

      expect(result).toEqual({
        success: true,
        data: mockExistingCompany,
      });
      expect(prisma.company.findFirst).toHaveBeenCalledWith({
        where: { value: "new company" },
        orderBy: [{ isGlobal: "desc" }, { label: "asc" }],
      });
      expect(prisma.company.create).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors", async () => {
      (getViewerContext as any).mockResolvedValue(mockViewer);
      (prisma.company.findFirst as any).mockRejectedValue(
        new Error("Unexpected error"),
      );

      const result = await addCompany(validData);

      expect(result).toEqual({ success: false, message: "Unexpected error" });
      expect(prisma.company.findFirst).toHaveBeenCalledWith({
        where: { value: "new company" },
        orderBy: [{ isGlobal: "desc" }, { label: "asc" }],
      });
      expect(prisma.company.create).not.toHaveBeenCalled();
    });

    it("should return error if logo URL is invalid", async () => {
      (getViewerContext as any).mockResolvedValue(mockViewer);

      const invalidData = {
        company: "New Company",
        logoUrl: "javascript:alert('xss')",
      };

      const result = await addCompany(invalidData);

      expect(result).toEqual({
        success: false,
        message: "Invalid logo URL. Only http and https protocols are allowed.",
      });

      expect(prisma.company.findFirst).not.toHaveBeenCalled();
      expect(prisma.company.create).not.toHaveBeenCalled();
    });

    it("should return error if logo URL has data protocol", async () => {
      (getCurrentUser as any).mockResolvedValue(mockUser);

      const invalidData = {
        company: "New Company",
        logoUrl: "data:image/png;base64,iVBORw0KGgo=",
      };

      const result = await addCompany(invalidData);

      expect(result).toEqual({
        success: false,
        message: "Invalid logo URL. Only http and https protocols are allowed.",
      });

      expect(prisma.company.create).not.toHaveBeenCalled();
    });

    it("should allow empty logo URL", async () => {
      (getCurrentUser as any).mockResolvedValue(mockUser);
      (prisma.company.findFirst as any).mockResolvedValue(null);
      const mockCompany = {
        id: "company-id",
        label: "New Company",
        value: "new company",
        logoUrl: "",
        createdBy: mockUser.id,
      };
      (prisma.company.create as any).mockResolvedValue(mockCompany);
      (revalidatePath as any).mockResolvedValue(undefined);

      const result = await addCompany({
        company: "New Company",
        logoUrl: "",
      });

      expect(result).toEqual({ success: true, data: mockCompany });
      expect(prisma.company.create).toHaveBeenCalled();
    });

    it("should allow https URLs", async () => {
      (getCurrentUser as any).mockResolvedValue(mockUser);
      (prisma.company.findFirst as any).mockResolvedValue(null);
      const mockCompany = {
        id: "company-id",
        label: "New Company",
        value: "new company",
        logoUrl: "https://example.com/logo.png",
        createdBy: mockUser.id,
      };
      (prisma.company.create as any).mockResolvedValue(mockCompany);
      (revalidatePath as any).mockResolvedValue(undefined);

      const result = await addCompany({
        company: "New Company",
        logoUrl: "https://example.com/logo.png",
      });

      expect(result).toEqual({ success: true, data: mockCompany });
      expect(prisma.company.create).toHaveBeenCalled();
    });
  });

  describe("updateCompany", () => {
    const validData = {
      id: "company-id",
      company: "Updated Company",
      logoUrl: "http://example.com/logo.png",
      createdBy: "user-id",
    };

    it("should update a company successfully", async () => {
      (getViewerContext as any).mockResolvedValue(mockViewer);

      (prisma.company.findUnique as any).mockResolvedValue({
        isGlobal: false,
        createdBy: mockUser.id,
      });
      (prisma.company.findFirst as any).mockResolvedValue(null);

      const mockUpdatedCompany = {
        id: "company-id",
        value: "updated company",
      };

      (prisma.company.update as any).mockResolvedValue(mockUpdatedCompany);

      const result = await updateCompany(validData);

      expect(result).toEqual({ success: true, data: mockUpdatedCompany });

      expect(prisma.company.findFirst).toHaveBeenCalledWith({
        where: {
          value: "updated company",
          id: { not: "company-id" },
        },
      });

      expect(prisma.company.update).toHaveBeenCalledWith({
        where: { id: "company-id" },
        data: {
          value: "updated company",
          label: "Updated Company",
          logoUrl: "http://example.com/logo.png",
        },
      });
    });

    it("should return error if user is not authenticated", async () => {
      (getViewerContext as any).mockResolvedValue(null);

      const result = await updateCompany(validData);

      expect(result).toEqual({ success: false, message: "Not authenticated" });

      expect(prisma.company.findFirst).not.toHaveBeenCalled();
      expect(prisma.company.update).not.toHaveBeenCalled();
    });

    it("should return error if company already exists", async () => {
      (getCurrentUser as any).mockResolvedValue(mockUser);

      (prisma.company.findFirst as any).mockResolvedValue({
        id: "existing-company-id",
      });

      const result = await updateCompany(validData);

      expect(result).toEqual({
        success: false,
        message: "Company already exists!",
      });

      expect(prisma.company.update).not.toHaveBeenCalled();
    });

    it("should return error if id is not provided or no user privileges", async () => {
      (getCurrentUser as any).mockResolvedValue(mockUser);

      const invalidData = { ...validData, id: "", createdBy: "other-user-id" };

      const result = await updateCompany(invalidData);

      expect(result).toEqual({
        success: false,
        message: "Company id is required",
      });

      expect(prisma.company.findFirst).not.toHaveBeenCalled();
      expect(prisma.company.update).not.toHaveBeenCalled();
    });

    it("should return error if logo URL is invalid", async () => {
      (getCurrentUser as any).mockResolvedValue(mockUser);

      const invalidData = {
        ...validData,
        logoUrl: "javascript:alert('xss')",
      };

      const result = await updateCompany(invalidData);

      expect(result).toEqual({
        success: false,
        message: "Invalid logo URL. Only http and https protocols are allowed.",
      });

      expect(prisma.company.findFirst).not.toHaveBeenCalled();
      expect(prisma.company.update).not.toHaveBeenCalled();
    });

    it("should return error if logo URL has data protocol", async () => {
      (getCurrentUser as any).mockResolvedValue(mockUser);

      const invalidData = {
        ...validData,
        logoUrl: "data:image/png;base64,iVBORw0KGgo=",
      };

      const result = await updateCompany(invalidData);

      expect(result).toEqual({
        success: false,
        message: "Invalid logo URL. Only http and https protocols are allowed.",
      });

      expect(prisma.company.update).not.toHaveBeenCalled();
    });

    it("should allow empty logo URL", async () => {
      (getCurrentUser as any).mockResolvedValue(mockUser);

      (prisma.company.findFirst as any).mockResolvedValue(null);

      const mockUpdatedCompany = {
        id: "company-id",
        value: "updated company",
      };

      (prisma.company.update as any).mockResolvedValue(mockUpdatedCompany);

      const result = await updateCompany({
        ...validData,
        logoUrl: "",
      });

      expect(result).toEqual({ success: true, data: mockUpdatedCompany });
      expect(prisma.company.update).toHaveBeenCalled();
    });
  });

  describe("getCompanyById", () => {
    const mockCompanyId = "company-id";
    const mockCompany = {
      id: "company-id",
      label: "Test Company",
      value: "test-company",
      createdBy: "user-id",
      logoUrl: "http://example.com/logo.png",
    };

    it("should fetch company by id successfully", async () => {
      (getViewerContext as any).mockResolvedValue(mockViewer);

      (prisma.company.findUnique as any).mockResolvedValue(mockCompany);

      const result = await getCompanyById(mockCompanyId);

      expect(prisma.company.findUnique).toHaveBeenCalledWith({
        where: { id: mockCompanyId },
      });

      expect(result).toEqual(mockCompany);
    });

    it("should throw error when companyId is not provided", async () => {
      await expect(getCompanyById("")).resolves.toStrictEqual({
        success: false,
        message: "Please provide company id",
      });

      expect(prisma.company.findUnique).not.toHaveBeenCalled();
    });

    it("should throw error when user is not authenticated", async () => {
      (getViewerContext as any).mockResolvedValue(null);

      await expect(getCompanyById(mockCompanyId)).resolves.toStrictEqual({
        success: false,
        message: "Not authenticated",
      });

      expect(prisma.company.findUnique).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors", async () => {
      (getViewerContext as any).mockResolvedValue(mockViewer);
      (prisma.company.findUnique as any).mockRejectedValue(
        new Error("Unexpected error"),
      );

      await expect(getCompanyById(mockCompanyId)).resolves.toStrictEqual({
        success: false,
        message: "Unexpected error",
      });

      expect(prisma.company.findUnique).toHaveBeenCalledWith({
        where: { id: mockCompanyId },
      });
    });
  });

  describe("deleteCompanyById", () => {
    it("should delete a company successfully", async () => {
      (getViewerContext as any).mockResolvedValue(mockViewer);
      (prisma.company.findUnique as any).mockResolvedValue({
        isGlobal: false,
        createdBy: mockUser.id,
      });
      (prisma.workExperience.count as any).mockResolvedValue(0);
      (prisma.job.count as any).mockResolvedValue(0);
      const mockDeleted = { id: "company-id", label: "Test Company" };
      (prisma.company.delete as any).mockResolvedValue(mockDeleted);

      const result = await deleteCompanyById("company-id");

      expect(result).toEqual({ res: mockDeleted, success: true });
      expect(prisma.company.delete).toHaveBeenCalledWith({
        where: { id: "company-id" },
      });
    });

    it("should return error for unauthenticated user", async () => {
      (getViewerContext as any).mockResolvedValue(null);

      const result = await deleteCompanyById("company-id");

      expect(result).toEqual({ success: false, message: "Not authenticated" });
      expect(prisma.company.delete).not.toHaveBeenCalled();
    });

    it("should prevent deletion when work experiences exist", async () => {
      (getViewerContext as any).mockResolvedValue(mockViewer);
      (prisma.company.findUnique as any).mockResolvedValue({
        isGlobal: false,
        createdBy: mockUser.id,
      });
      (prisma.workExperience.count as any).mockResolvedValue(1);

      const result = await deleteCompanyById("company-id");

      expect(result).toEqual({
        success: false,
        message:
          "Company cannot be deleted due to its use in experience section of one of the resume! ",
      });
      expect(prisma.job.count).not.toHaveBeenCalled();
      expect(prisma.company.delete).not.toHaveBeenCalled();
    });

    it("should prevent deletion when associated jobs exist", async () => {
      (getViewerContext as any).mockResolvedValue(mockViewer);
      (prisma.company.findUnique as any).mockResolvedValue({
        isGlobal: false,
        createdBy: mockUser.id,
      });
      (prisma.workExperience.count as any).mockResolvedValue(0);
      (prisma.job.count as any).mockResolvedValue(3);

      const result = await deleteCompanyById("company-id");

      expect(result).toEqual({
        success: false,
        message:
          "Company cannot be deleted due to 3 number of associated jobs! ",
      });
      expect(prisma.company.delete).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors", async () => {
      (getCurrentUser as any).mockResolvedValue(mockUser);
      (prisma.workExperience.count as any).mockResolvedValue(0);
      (prisma.job.count as any).mockResolvedValue(0);
      (prisma.company.delete as any).mockRejectedValue(
        new Error("Delete failed"),
      );

      const result = await deleteCompanyById("company-id");

      expect(result).toEqual({ success: false, message: "Delete failed" });
    });
  });
});
