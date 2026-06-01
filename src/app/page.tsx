import { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import LandingPage from "@/components/landing/LandingPage";
import { APP_NAME } from "@config/app-name";

export const metadata: Metadata = {
  title: APP_NAME,
  description:
    "Build your career with high-paying remote opportunities. Personalized job matching and end-to-end interview support for developers.",
};

export default async function RootPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
