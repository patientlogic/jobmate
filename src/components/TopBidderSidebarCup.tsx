"use client";

import { Shield } from "lucide-react";
import { useJobBidsLeaderboard } from "@/context/JobBidsLeaderboardContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type TopBidderSidebarCupProps = {
  collapsed: boolean;
};

const HERO_MESSAGE =
  "Congrats! you're top hero, send more proposals and keep your hero badge.";

function HeroBadge({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        compact ? "h-11 w-11" : "h-[5.5rem] w-[5.5rem]",
      )}
    >
      <span
        className={cn(
          "absolute -left-1 top-0 animate-encouragement-sparkle",
          compact ? "text-xs" : "text-base",
        )}
      >
        ⭐
      </span>
      <span
        className={cn(
          "absolute -right-1 top-2 animate-encouragement-sparkle [animation-delay:350ms]",
          compact ? "text-xs" : "text-sm",
        )}
      >
        ✨
      </span>
      <span
        className={cn(
          "absolute bottom-0 left-0 animate-hero-badge-shine",
          compact ? "text-xs" : "text-sm",
        )}
      >
        🎉
      </span>

      <div
        className={cn(
          "relative flex animate-hero-badge-bounce flex-col items-center justify-center rounded-2xl border-[3px] border-amber-500 bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 shadow-[0_0_18px_rgba(251,191,36,0.55)]",
          compact ? "h-10 w-10 rounded-xl border-2" : "h-[4.5rem] w-[4.5rem]",
        )}
      >
        <Shield
          className={cn(
            "absolute text-amber-700/15",
            compact ? "h-9 w-9" : "h-[4rem] w-[4rem]",
          )}
          strokeWidth={1.25}
        />
        <span className={cn("relative z-10 leading-none", compact ? "text-lg" : "text-3xl")}>
          🦸
        </span>
        {!compact ? (
          <span className="relative z-10 mt-0.5 text-[9px] font-black tracking-[0.2em] text-amber-950">
            HERO
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function TopBidderSidebarCup({ collapsed }: TopBidderSidebarCupProps) {
  const { isLoading, isViewerTopBidder } = useJobBidsLeaderboard();

  if (isLoading || !isViewerTopBidder) {
    return null;
  }

  if (collapsed) {
    return (
      <div
        className={cn(
          "flex shrink-0 flex-col items-center justify-center px-1 py-3",
        )}
      >
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="pointer-events-auto flex justify-center">
                <div className="animate-top-bidder-float">
                  <HeroBadge compact />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[220px] text-xs leading-snug">
              {HERO_MESSAGE}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none flex max-w-[12.5rem] shrink-0 flex-col items-center px-3 py-2 text-center"
      aria-hidden
    >
      <div className="animate-top-bidder-float">
        <div className="relative">
          <div className="absolute inset-0 animate-top-bidder-glow rounded-full bg-amber-400/30 blur-xl" />
          <HeroBadge />
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-snug font-medium text-amber-800 dark:text-amber-300">
        {HERO_MESSAGE}
      </p>
    </div>
  );
}
