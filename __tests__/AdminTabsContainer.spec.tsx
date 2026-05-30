import { screen, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminTabsContainer from "@/components/admin/AdminTabsContainer";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/dashboard/admin",
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/actions/company.actions", () => ({
  getCompanyList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  getCompanyById: vi.fn(),
  getAllCompanies: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/actions/jobtitle.actions", () => ({
  getJobTitleList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
}));

vi.mock("@/actions/jobLocation.actions", () => ({
  getJobLocationsList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
}));

vi.mock("@/actions/activity.actions", () => ({
  getActivityTypeList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  createActivityType: vi.fn(),
}));

vi.mock("@/actions/site-admin.actions", () => ({
  listJobBidders: vi.fn().mockResolvedValue([]),
  getAllAppliedJobsList: vi.fn().mockResolvedValue({ success: true, data: [], total: 0 }),
}));

describe("AdminTabsContainer", () => {
  const user = userEvent.setup({ skipHover: true });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all tabs for admin", () => {
    render(<AdminTabsContainer isAdmin />);

    expect(screen.getByRole("tab", { name: "Companies" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Job Titles" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Locations" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Activity Types" }),
    ).toBeInTheDocument();
  });

  it("should not render companies tab for non-admins", () => {
    render(<AdminTabsContainer isAdmin={false} />);

    expect(
      screen.queryByRole("tab", { name: "Companies" }),
    ).not.toBeInTheDocument();
  });

  it("should default to companies tab for admin", () => {
    render(<AdminTabsContainer isAdmin />);

    const companiesTab = screen.getByRole("tab", { name: "Companies" });
    expect(companiesTab).toHaveAttribute("data-state", "active");
  });

  it("should default to job titles tab for non-admin", () => {
    render(<AdminTabsContainer isAdmin={false} />);

    const jobTitlesTab = screen.getByRole("tab", { name: "Job Titles" });
    expect(jobTitlesTab).toHaveAttribute("data-state", "active");
  });

  it("should switch tabs and update URL", async () => {
    render(<AdminTabsContainer isAdmin={false} />);

    const jobTitlesTab = screen.getByRole("tab", { name: "Job Titles" });
    await user.click(jobTitlesTab);

    expect(mockPush).toHaveBeenCalledWith(
      "/dashboard/admin?tab=job-titles"
    );
  });

  it("should switch to locations tab and update URL", async () => {
    render(<AdminTabsContainer isAdmin={false} />);

    const locationsTab = screen.getByRole("tab", { name: "Locations" });
    await user.click(locationsTab);

    expect(mockPush).toHaveBeenCalledWith(
      "/dashboard/admin?tab=locations"
    );
  });

  it("should switch to activity types tab and update URL", async () => {
    render(<AdminTabsContainer isAdmin={false} />);

    const activityTypesTab = screen.getByRole("tab", {
      name: "Activity Types",
    });
    await user.click(activityTypesTab);

    expect(mockPush).toHaveBeenCalledWith(
      "/dashboard/admin?tab=activity-types"
    );
  });

  it("should render users tab when admin", () => {
    render(<AdminTabsContainer isAdmin />);

    expect(screen.getByRole("tab", { name: "Users" })).toBeInTheDocument();
  });

  it("should not render users tab for non-admins", () => {
    render(<AdminTabsContainer isAdmin={false} />);

    expect(screen.queryByRole("tab", { name: "Users" })).not.toBeInTheDocument();
  });

  it("should render applied jobs tab when admin", () => {
    render(<AdminTabsContainer isAdmin />);

    expect(
      screen.getByRole("tab", { name: "Applied Jobs" }),
    ).toBeInTheDocument();
  });

  it("should not render applied jobs tab for non-admins", () => {
    render(<AdminTabsContainer isAdmin={false} />);

    expect(
      screen.queryByRole("tab", { name: "Applied Jobs" }),
    ).not.toBeInTheDocument();
  });

  it("should switch to applied jobs tab and update URL", async () => {
    render(<AdminTabsContainer isAdmin />);

    const appliedJobsTab = screen.getByRole("tab", { name: "Applied Jobs" });
    await user.click(appliedJobsTab);

    expect(mockPush).toHaveBeenCalledWith("/dashboard/admin?tab=applied-jobs");
  });

  it("should switch to users tab and update URL", async () => {
    render(<AdminTabsContainer isAdmin />);

    const usersTab = screen.getByRole("tab", { name: "Users" });
    await user.click(usersTab);

    expect(mockPush).toHaveBeenCalledWith("/dashboard/admin?tab=users");
  });

  it("should render companies tab panel content by default for admin", async () => {
    render(<AdminTabsContainer isAdmin />);

    await waitFor(() => {
      expect(screen.getByTestId("add-company-btn")).toBeInTheDocument();
    });
  });
});
