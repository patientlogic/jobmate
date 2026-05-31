import { z } from "zod";

export const AddMeetingFormSchema = z
  .object({
    id: z.string().optional(),
    jobId: z.string().min(1, "Please select an applied job"),
    positionRole: z.string().min(1, "Position/Role is required"),
    accountName: z.string().optional(),
    startDateTime: z.date(),
    endDateTime: z.date(),
    timeZone: z.string().min(1, "Timezone is required"),
    companyName: z.string().min(1, "Company name is required"),
    meetingLink: z.string().optional(),
    interviewStep: z.string().min(1, "Interview step is required"),
    meetingType: z.string().min(1, "Meeting type is required"),
    status: z.string().min(1, "Status is required"),
    area: z.string().optional(),
    address: z.string().optional(),
    dob: z.date().optional(),
    resumeUrl: z.string().optional(),
    salaryExpectation: z.string().optional(),
    jobDescription: z.string().optional(),
    assignedDeveloperId: z.string().optional(),
  })
  .refine((data) => data.endDateTime > data.startDateTime, {
    message: "End date and time must be after the start date and time",
    path: ["endDateTime"],
  });
