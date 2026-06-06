"use client";

import { Rocket } from "lucide-react";
import { useJobBidsLeaderboard } from "@/context/JobBidsLeaderboardContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type JobBidCatchUpEncouragementProps = {
  collapsed: boolean;
};

function EncouragementRocket({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        compact ? "h-10 w-10" : "mb-3 h-16 w-16",
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-1 animate-encouragement-sparkle",
          compact ? "text-sm" : "text-lg",
        )}
      >
        ✨
      </span>
      <span
        className={cn(
          "absolute right-0 top-0 animate-encouragement-sparkle [animation-delay:300ms]",
          compact ? "text-sm" : "text-base",
        )}
      >
        🔥
      </span>
      <span className="absolute -bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 overflow-hidden">
        <span className="block h-full w-2 animate-encouragement-dash rounded-full bg-violet-400/70" />
      </span>
      <Rocket
        className={cn(
          "relative z-10 animate-encouragement-rocket text-violet-500 drop-shadow-[0_0_10px_rgba(139,92,246,0.45)]",
          compact ? "h-7 w-7" : "h-11 w-11",
        )}
        strokeWidth={1.75}
      />
    </div>
  );
}

export function JobBidCatchUpEncouragement({
  collapsed,
}: JobBidCatchUpEncouragementProps) {
  const { isLoading, showBidEncouragement } = useJobBidsLeaderboard();

  if (isLoading || !showBidEncouragement) {
    return null;
  }

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="pointer-events-auto flex justify-center px-1">
              <EncouragementRocket compact />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[220px] text-xs leading-snug">
            Try more bids and catch up top job bidders, so that you can get hero
            badge 🏅
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className="pointer-events-none flex max-w-[12.5rem] flex-col items-center px-3 py-2 text-center"
      aria-hidden
    >
      <EncouragementRocket />
      <p className="text-[11px] leading-snug text-muted-foreground">
        Try more bids and catch up top job bidders, so that you can get{" "}
        <span className="inline-block animate-encouragement-wiggle font-bold text-violet-600 dark:text-violet-400">
          hero badge 🏅
        </span>
      </p>
      <p className="mt-2 animate-encouragement-wiggle text-[10px] font-semibold uppercase tracking-wide text-violet-500/80">
        You got this! 💪
      </p>
    </div>
  );
}
