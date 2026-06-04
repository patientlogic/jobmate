import { AddJob } from "@/components/myjobs/AddJob";
import { JOB_SOURCES } from "@/lib/data/jobSourcesData";
import { JOB_STATUSES } from "@/lib/data/jobStatusesData";
import { getMockList } from "@/lib/mock.utils";
import { screen, render, waitFor } from "@testing-library/react";
import { getCurrentUser } from "@/utils/user.utils";
import userEvent from "@testing-library/user-event";
import { addJob } from "@/actions/job.actions";

vi.mock("@/actions/profile.actions", () => ({
  getResumeList: vi.fn().mockResolvedValue({
    data: [{ id: "resume-1", title: "Default Resume" }],
    success: true,
    total: 1,
  }),
}));

vi.mock("@/actions/company.actions", () => ({
  getAllCompanies: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/utils/user.utils", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/actions/job.actions", () => ({
  addJob: vi.fn().mockResolvedValue({ success: true, job: { id: "job-1" } }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

document.createRange = () => {
  const range = new Range();

  range.getBoundingClientRect = vi.fn().mockReturnValue({
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
  });

  range.getClientRects = () => {
    return {
      item: () => null,
      length: 0,
      [Symbol.iterator]: vi.fn(),
    };
  };

  return range;
};

describe("AddJob Component", () => {
  const mockUser = { id: "user-id" };
  const mockJobStatuses = JOB_STATUSES;
  const mockJobSources = JOB_SOURCES;
  const mockTags = [
    { id: "tag-1", label: "React", value: "react", createdBy: "user-id" },
  ];
  const mockResetEditJob = vi.fn();
  const user = userEvent.setup({ skipHover: true });
  window.HTMLElement.prototype.scrollIntoView = vi.fn(); // Fixes the issue with combobox
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();

  async function expandAdvancedDetails() {
    const trigger = screen.getByTestId("advanced-job-details-trigger");
    await user.click(trigger);
  }

  beforeEach(async () => {
    const mockCompanies = (await getMockList(1, 10, "companies")).data;
    const mockJobTitles = (await getMockList(1, 10, "jobTitles")).data;
    const mockLocations = (await getMockList(1, 10, "locations")).data;
    vi.clearAllMocks();
    render(
      <AddJob
        jobStatuses={mockJobStatuses}
        companies={mockCompanies}
        jobTitles={mockJobTitles}
        locations={mockLocations}
        jobSources={mockJobSources}
        tags={mockTags}
        editJob={null}
        resetEditJob={mockResetEditJob}
      />,
    );
    const addJobButton = screen.getByTestId("add-job-btn");
    await user.click(addJobButton);
  });

  it("should open the dialog when clicked on add job button with title 'Add Job'", async () => {
    (getCurrentUser as any).mockResolvedValue(mockUser);

    const dialogTitle = screen.getByTestId("add-job-dialog-title");
    expect(dialogTitle).toBeInTheDocument();
    expect(dialogTitle).toHaveTextContent("Add Job");
  });
  it("should not show applied switch or date applied when adding a job", async () => {
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Date Applied")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Due Date")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Cover Letter")).not.toBeInTheDocument();
  });
  it("should open the dialog when clicked on add job button with title 'Edit Job'", async () => {
    // TODO: To be tested with job container and jobs table component
  });
  it("should show relevant react-hook-form errors", async () => {
    const saveBtn = screen.getByTestId("save-job-btn");
    await user.click(saveBtn);
    expect(screen.getByText("Job URL is required.")).toBeInTheDocument();
    expect(screen.getByText("Resume is required.")).toBeInTheDocument();
  });
  it("should close the dialog when clicked on cancel button", async () => {
    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    const dialog = await screen.findByRole("dialog");
    await user.click(cancelBtn);
    expect(dialog).not.toBeInTheDocument();
  });
  it("should load and show the job title combobox list", async () => {
    await expandAdvancedDetails();
    const jobTitleCombobox = screen.getByLabelText("Job Title");
    await user.click(jobTitleCombobox);
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
    expect(options[0].textContent).toBe("Frontend Developer");
  });
  it("should load and show the company combobox list", async () => {
    await expandAdvancedDetails();
    const companyCombobox = screen.getByLabelText("Company");
    await user.click(companyCombobox);
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
    expect(options[0].textContent).toBe("Google");
  });
  it("should load and show the location combobox list", async () => {
    await expandAdvancedDetails();
    const locationCombobox = screen.getByLabelText("Job Location");
    await user.click(locationCombobox);
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
    expect(options[0].textContent).toBe("San Francisco");
  });
  it("should load and show the job source combobox list", async () => {
    await expandAdvancedDetails();
    const sourceCombobox = screen.getByLabelText("Job Source");
    await user.click(sourceCombobox);
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
    expect(options[0].textContent).toBe("Indeed");
  });
  it("should load and show the salary range select list", async () => {
    await expandAdvancedDetails();
    const salaryRangeSelect = screen.getByLabelText("Salary Range");
    await user.click(salaryRangeSelect);
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
    expect(options[0].textContent).toBe("0 - 10,000");
  });
  it("should load and show the status select list", async () => {
    await expandAdvancedDetails();
    const statusSelect = screen.getByLabelText("Status");
    await user.click(statusSelect);
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
    expect(options[0].textContent).toBe("Draft");
  });
  it("should closes the dialog and submit to save job when clicked on save button", async () => {
    const jobUrlInput = screen.getByPlaceholderText(
      "Copy and paste job link here",
    );
    await user.type(jobUrlInput, "https://example.com/jobs/123");

    const resumeSelect = screen.getByLabelText("Resume");
    await user.click(resumeSelect);
    await user.click(screen.getByRole("option", { name: "Default Resume" }));

    const dialog = await screen.findByRole("dialog");
    const saveBtn = screen.getByTestId("save-job-btn");
    await user.click(saveBtn);

    await waitFor(() => {
      expect(addJob).toHaveBeenCalledTimes(1);
      expect(dialog).not.toBeInTheDocument();
      expect(addJob).toHaveBeenCalledWith(
        expect.objectContaining({
          jobUrl: "https://example.com/jobs/123",
          resume: "resume-1",
          type: "FT",
          status: "5e7c6e8c-83e6-46e3-bf01-db8f0b503399",
          applied: true,
          tags: [],
        }),
        undefined,
      );
    });
  });
});
