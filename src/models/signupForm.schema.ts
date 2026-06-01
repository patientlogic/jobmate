import { z } from "zod";

export const SIGNUP_ROLE_OPTIONS = [
  { value: "USER", label: "Job bidder" },
  { value: "DEVELOPER", label: "Developer/Caller" },
  { value: "ARTIST", label: "Artist" },
] as const;

export type SignupRole = (typeof SIGNUP_ROLE_OPTIONS)[number]["value"];

export const SignupFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z
    .string({
      error: "Email is required.",
    })
    .min(3, {
      message: "Email must be at least 3 characters.",
    })
    .email("Please enter a valid email."),
  password: z
    .string({
      error: "Please enter your password.",
    })
    .min(6, {
      message: "Password must be at least 6 characters.",
    }),
  role: z.enum(["USER", "DEVELOPER", "ARTIST"], {
    error: "Please select a role.",
  }),
});
