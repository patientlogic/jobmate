"use client";

import { Crown, Trophy } from "lucide-react";
import { useJobBidsLeaderboard } from "@/context/JobBidsLeaderboardContext";
import type { TodayJobBidsLeaderboard } from "@/actions/jobBidsLeaderboard.actions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function displayBidderName(
  bidder: TodayJobBidsLeaderboard["topBidders"][number],
) {
  return bidder.isViewer ? "You" : bidder.name;
}

function formatTopBidders(
  topBidders: TodayJobBidsLeaderboard["topBidders"],
  showCount: boolean,
) {
  if (topBidders.length === 0) {
    return "No bids yet";
  }

  if (!showCount) {
    return topBidders.map((bidder) => displayBidderName(bidder)).join(" & ");
  }

  if (topBidders.length === 1) {
    const count = topBidders[0].count;
    return count != null
      ? `${displayBidderName(topBidders[0])} (${count})`
      : displayBidderName(topBidders[0]);
  }

  const names = topBidders.map((bidder) => displayBidderName(bidder)).join(" & ");
  const count = topBidders[0].count;
  return count != null ? `${names} (${count} each)` : names;
}

export function TodayJobBidsContest() {
  const { stats, isLoading, isViewerTopBidder } = useJobBidsLeaderboard();

  if (isLoading) {
    return (
      <div
        className="flex h-9 min-w-[88px] animate-pulse rounded-full border bg-muted/40 md:min-w-[220px]"
        aria-hidden
      />
    );
  }

  if (!stats) {
    return null;
  }

  const topLabel = formatTopBidders(stats.topBidders, stats.isAdminView);
  const countLabelMobile = stats.isAdminView ? "Bids: " : "Your bids: ";
  const countLabelDesktop = stats.isAdminView
    ? "Today's bids: "
    : "Your bids today: ";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-sm transition-colors",
              isViewerTopBidder
                ? "border-amber-500/60 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent ring-1 ring-amber-500/25 hover:border-amber-500/80"
                : "border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent hover:border-amber-500/50",
            )}
            aria-label={
              isViewerTopBidder
                ? "You are today's top job bidder"
                : "Today's job bids contest"
            }
          >
            {isViewerTopBidder ? (
              <Crown
                className="h-4 w-4 shrink-0 fill-amber-400/30 text-amber-500"
                aria-hidden
              />
            ) : (
              <Trophy className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
            )}
            <div className="flex min-w-0 items-center gap-2">
              {isViewerTopBidder ? (
                <span className="whitespace-nowrap font-semibold text-amber-600 dark:text-amber-400">
                  Top bidder!
                </span>
              ) : null}
              {isViewerTopBidder ? (
                <span className="hidden sm:inline text-muted-foreground">·</span>
              ) : null}
              <span className="whitespace-nowrap font-medium text-foreground">
                <span className="md:hidden">{countLabelMobile}</span>
                <span className="hidden md:inline">{countLabelDesktop}</span>
                <span className="tabular-nums text-amber-600 dark:text-amber-400">
                  {stats.totalBids}
                </span>
              </span>
              {stats.topBidders.length > 0 ? (
                <>
                  <span className="hidden md:inline text-muted-foreground">·</span>
                  <span className="hidden md:inline truncate text-muted-foreground">
                    Top:{" "}
                    <span className="font-medium text-foreground">{topLabel}</span>
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="end"
          sideOffset={8}
          className="w-[min(22rem,92vw)] min-w-[18rem] max-w-md rounded-lg p-5 shadow-lg"
        >
          <p className="mb-4 text-base font-semibold tracking-tight">
            Today&apos;s bid leaderboard
          </p>
          {stats.leaders.length > 0 ? (
            <ul className="space-y-2.5 text-base">
              {stats.leaders.map((leader, index) => (
                <li
                  key={leader.userId}
                  className={cn(
                    "flex items-center gap-3 py-0.5",
                    stats.isAdminView && "justify-between gap-6",
                  )}
                >
                  <span className="truncate">
                    {index === 0 ? "👑 " : `${index + 1}. `}
                    {displayBidderName(leader)}
                  </span>
                  {stats.isAdminView ? (
                    <span className="shrink-0 text-lg font-semibold tabular-nums">
                      {leader.count}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-muted-foreground">
              No job bids yet today. Be the first on the board!
            </p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Updates every 30 seconds
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
