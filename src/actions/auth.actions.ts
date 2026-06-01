"use server";
import { AuthError } from "next-auth";
import { signIn } from "../auth";
import { delay } from "@/utils/delay";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignupFormSchema } from "@/models/signupForm.schema";
import { JOB_SOURCES, JOB_STATUSES, ACCOUNT_ACTIVATION } from "@/lib/constants";
import { UserRole } from "@prisma/client";

export async function signup(formData: {
  name: string;
  email: string;
  password: string;
  role: "USER" | "DEVELOPER";
}) {
  const parsed = SignupFormSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Invalid form data." };
  }

  const { name, email, password, role } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userRole = role === "DEVELOPER" ? UserRole.DEVELOPER : UserRole.USER;

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: userRole,
      isActivated: false,
    },
  });

  await prisma.jobSource.createMany({
    data: JOB_SOURCES.map((source) => ({
      label: source.label,
      value: source.value,
      createdBy: newUser.id,
    })),
  });

  for (const status of JOB_STATUSES) {
    await prisma.jobStatus.upsert({
      where: { value: status.value },
      update: {},
      create: status,
    });
  }

  return { success: true };
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { password: true, isActivated: true, role: true },
    });

    if (user) {
      const passwordsMatch = await bcrypt.compare(password, user.password);
      if (
        passwordsMatch &&
        user.role !== UserRole.ADMIN &&
        !user.isActivated
      ) {
        return ACCOUNT_ACTIVATION.PENDING_LOGIN_CODE;
      }
    }

    await delay(1000);
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}
