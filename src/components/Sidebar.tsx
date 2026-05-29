"use client";

import Link from "next/link";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Settings } from "lucide-react";
import { SIDEBAR_LINKS } from "@/lib/constants";
import NavLink from "./NavLink";
import { usePathname } from "next/navigation";
import { AppLogo } from "./AppLogo";

function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const path = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        {/* <AppLogo size="sm" showTile={false} priority /> */}
        <TooltipProvider delayDuration={800}>
          {SIDEBAR_LINKS.map((item) => {
            // Only show dev-only items in development mode
            if (item.devOnly && process.env.NODE_ENV !== "development") {
              return null;
            }
            if ("adminOnly" in item && item.adminOnly && !isAdmin) {
              return null;
            }
            return (
              <div key={item.label} className="text-white fill-color">
                <NavLink
                  label={item.label}
                  Icon={item.icon}
                  route={item.route}
                  pathname={path}
                />
              </div>
            );
          })}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
          <NavLink
            label="Settings"
            Icon={Settings}
            route="/dashboard/settings"
            pathname={path}
          />
        </TooltipProvider>
      </nav>
    </aside>
  );
}

export default Sidebar;
