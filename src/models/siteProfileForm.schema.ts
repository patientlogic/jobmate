import { z } from "zod";

export const SiteProfileFormSchema = z.object({
  id: z.string().optional(),
  siteUrl: z
    .string({
      error: "Site URL is required.",
    })
    .url({
      message: "Enter a valid site URL.",
    }),
  accountName: z
    .string({
      error: "Account name is required.",
    })
    .min(1, {
      message: "Account name is required.",
    })
    .max(100, {
      message: "Account name must be less than 100 characters.",
    }),
  email: z
    .string({
      error: "Email is required.",
    })
    .email({
      message: "Enter a valid email address.",
    }),
  password: z.string().optional(),
});
