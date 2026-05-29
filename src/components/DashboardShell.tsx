"use client";

import { cn } from "@/lib/utils";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import Sidebar from "@/components/Sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
  isAdmin: boolean;
};

export default function DashboardShell({
  children,
  isAdmin,
}: DashboardShellProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Sidebar isAdmin={isAdmin} />
        <DashboardMain>{children}</DashboardMain>
      </div>
    </SidebarProvider>
  );
}

function DashboardMain({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        "flex flex-1 flex-col transition-[padding-left] duration-200 ease-in-out sm:gap-4 sm:py-4",
        collapsed ? "sm:pl-16" : "sm:pl-56",
      )}
    >
      {children}
    </div>
  );
}
