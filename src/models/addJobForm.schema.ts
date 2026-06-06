import { z } from "zod";

export const AddJobFormSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  title: z
    .string({ error: "Job title is required." })
    .min(1, { message: "Job title is required." }),
  company: z.string().optional(),
  location: z.string().optional(),
  type: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  dateApplied: z.date().optional(),
  salaryRange: z.string().optional(),
  jobDescription: z.string().optional(),
  jobUrl: z
    .string({ error: "Job URL is required." })
    .min(1, { message: "Job URL is required." }),
  applied: z.boolean().default(false),
  resume: z
    .string({ error: "Resume is required." })
    .min(1, { message: "Resume is required." }),
  tags: z.array(z.string()).max(10).optional().default([]),
});
