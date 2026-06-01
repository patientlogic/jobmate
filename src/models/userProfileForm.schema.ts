import { z } from "zod";

export const UpdateUserProfileSchema = z.object({
  displayName: z.string().min(1, "Display name is required."),
  headline: z.string().max(220),
  bio: z.string().max(5000).optional().nullable(),
  skills: z.array(z.string().min(1).max(80)).max(30),
  avatarUrl: z.string().optional().nullable(),
  resumeUrl: z.string().optional().nullable(),
  resumeName: z.string().optional().nullable(),
});

export const ProfileExperienceFormSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().min(1, "Job title is required."),
    company: z.string().min(1, "Company is required."),
    location: z.string().optional().nullable(),
    startDate: z.date({ error: "Start date is required." }),
    endDate: z.date().optional().nullable(),
    isCurrent: z.boolean(),
    description: z.string().max(5000).optional().nullable(),
  })
  .refine(
    (data) => data.isCurrent || data.endDate,
    {
      message: "End date is required unless this is your current role.",
      path: ["endDate"],
    },
  );
