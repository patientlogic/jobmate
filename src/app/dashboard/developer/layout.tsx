import { auth } from "@/auth";
import { canAccessDeveloperOptions, parseUserRole } from "@/lib/user-roles";
import { redirect } from "next/navigation";

export default async function DeveloperLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const role = parseUserRole(session?.user?.role);

  if (!canAccessDeveloperOptions(role)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
