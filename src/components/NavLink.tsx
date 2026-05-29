import React, { ForwardRefExoticComponent, RefAttributes } from "react";
import Link from "next/link";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  label: string;
  Icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  route: string;
  pathname: string;
  collapsed?: boolean;
}

function NavLink({ label, Icon, route, pathname, collapsed = false }: NavLinkProps) {
  const isActive =
    pathname === route ||
    (route !== "/dashboard" && pathname.startsWith(`${route}/`));

  const link = (
    <Link
      href={route}
      className={cn(
        "flex items-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        collapsed
          ? "h-9 w-9 justify-center md:h-8 md:w-8"
          : "w-full gap-3 px-3 py-2",
        isActive && "bg-accent font-medium text-foreground",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {collapsed ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className="truncate">{label}</span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export default NavLink;
