"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { SIDEBAR_LINKS } from "@/lib/constants";
import NavLink from "./NavLink";
import { usePathname } from "next/navigation";
import { AppLogo } from "./AppLogo";
import { useSidebar } from "@/context/SidebarContext";
import { APP_NAME } from "@config/app-name";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const path = usePathname();
  const { collapsed, toggleCollapsed } = useSidebar();

  const navItems = SIDEBAR_LINKS.filter((item) => {
    if (item.devOnly && process.env.NODE_ENV !== "development") return false;
    if ("adminOnly" in item && item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background transition-[width] duration-200 ease-in-out sm:flex",
        collapsed ? "w-16" : "w-56",
      )}
    >
      {/* <div
        className={cn(
          "flex shrink-0 items-center border-b px-3 py-4",
          collapsed ? "justify-center" : "gap-2.5",
        )}
      >
        <AppLogo size="sm" showTile={false} priority />
        {!collapsed && (
          <span className="truncate text-sm font-semibold">{APP_NAME}</span>
        )}
      </div> */}

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
        <TooltipProvider delayDuration={400}>
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              label={item.label}
              Icon={item.icon}
              route={item.route}
              pathname={path}
              collapsed={collapsed}
            />
          ))}
        </TooltipProvider>
      </nav>

      <nav className="flex shrink-0 flex-col gap-1 border-t px-2 py-3">
        <TooltipProvider delayDuration={400}>
          <NavLink
            label="Settings"
            Icon={Settings}
            route="/dashboard/settings"
            pathname={path}
            collapsed={collapsed}
          />
        </TooltipProvider>
        <Button
          type="button"
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={toggleCollapsed}
          className={cn(
            "text-muted-foreground hover:text-foreground",
            collapsed ? "mx-auto h-9 w-9" : "w-full justify-start gap-3 px-3",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 shrink-0" />
              <span className="truncate text-sm">Collapse</span>
            </>
          )}
        </Button>
      </nav>
    </aside>
  );
}

export default Sidebar;
