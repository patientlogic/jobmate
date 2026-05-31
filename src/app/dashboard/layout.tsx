import Header from "@/components/Header";
import DashboardShell from "@/components/DashboardShell";
import { Toaster } from "@/components/ui/toaster";
import { ActivityProvider } from "@/context/ActivityContext";
import { GlobalActivityBanner } from "@/components/activities/GlobalActivityBanner";
import { auth } from "@/auth";
import {
  canAccessDeveloperOptions,
  isAdminRole,
  parseUserRole,
} from "@/lib/user-roles";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const role = parseUserRole(session?.user?.role);
  const isAdmin = isAdminRole(role);
  const canAccessDeveloper = canAccessDeveloperOptions(role);

  return (
    <ActivityProvider>
      <DashboardShell isAdmin={isAdmin} canAccessDeveloper={canAccessDeveloper}>
        <Header />
        <GlobalActivityBanner />
        <main className="flex-1 md:block lg:grid items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-4 lg:grid-cols-3 xl:grid-cols-3">
          {children}
        </main>
        <Toaster />
      </DashboardShell>
    </ActivityProvider>
  );
}
