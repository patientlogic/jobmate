"use client";

import { useId } from "react";
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

function HeroBadgeIcon({ compact = false }: { compact?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const size = compact ? 44 : 88;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_4px_14px_rgba(217,119,6,0.45)]"
      aria-hidden
      shapeRendering="geometricPrecision"
    >
      <defs>
        <linearGradient id={`hero-badge-gold-${uid}`} x1="20" y1="12" x2="100" y2="108">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="38%" stopColor="#FBBF24" />
          <stop offset="72%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id={`hero-badge-shine-${uid}`} x1="30" y1="18" x2="78" y2="72">
          <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFFBEB" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`hero-badge-ribbon-${uid}`} x1="36" y1="88" x2="84" y2="112">
          <stop offset="0%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
        <filter id={`hero-badge-soft-shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#92400E" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter={`url(#hero-badge-soft-shadow-${uid})`}>
        <path
          d="M60 8 L98 24 V58 C98 82 78 98 60 108 C42 98 22 82 22 58 V24 L60 8 Z"
          fill={`url(#hero-badge-gold-${uid})`}
          stroke="#D97706"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M60 16 L90 29 V57 C90 77 74 91 60 99 C46 91 30 77 30 57 V29 L60 16 Z"
          fill={`url(#hero-badge-shine-${uid})`}
        />
        <path
          d="M44 34 H76 L72 52 H48 L44 34 Z M48 52 H72 V58 L60 68 L48 58 V52 Z"
          fill="#92400E"
          opacity="0.92"
        />
        <path
          d="M48 52 H72 V58 L60 68 L48 58 V52 Z"
          fill="#FDE68A"
        />
        <circle cx="60" cy="40" r="7" fill="#FEF3C7" stroke="#B45309" strokeWidth="2" />
        <path
          d="M36 88 H84 L78 104 H42 L36 88 Z"
          fill={`url(#hero-badge-ribbon-${uid})`}
          stroke="#7F1D1D"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <text
          x="60"
          y="99"
          textAnchor="middle"
          fill="#FEF3C7"
          fontSize="11"
          fontWeight="800"
          letterSpacing="2"
          fontFamily="system-ui, -apple-system, Segoe UI, sans-serif"
        >
          HERO
        </text>
        <path
          d="M60 18 L62.8 26.2 L71.5 26.2 L64.4 31.4 L67.1 39.6 L60 34.5 L52.9 39.6 L55.6 31.4 L48.5 26.2 L57.2 26.2 Z"
          fill="#FEF3C7"
          stroke="#D97706"
          strokeWidth="1.2"
        />
      </g>
    </svg>
  );
}

function HeroBadge({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        compact ? "h-12 w-12" : "h-[6.25rem] w-[6.25rem]",
      )}
    >
      <span
        className={cn(
          "absolute -left-1 top-0 animate-encouragement-sparkle select-none",
          compact ? "text-sm" : "text-lg",
        )}
      >
        ⭐
      </span>
      <span
        className={cn(
          "absolute -right-1 top-2 animate-encouragement-sparkle select-none [animation-delay:350ms]",
          compact ? "text-sm" : "text-base",
        )}
      >
        ✨
      </span>
      <span
        className={cn(
          "absolute bottom-0 left-0 animate-hero-badge-shine select-none",
          compact ? "text-sm" : "text-base",
        )}
      >
        🎉
      </span>

      <div className={cn("relative animate-hero-badge-bounce", compact ? "scale-100" : "scale-100")}>
        <HeroBadgeIcon compact={compact} />
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
      <div className="flex shrink-0 flex-col items-center justify-center px-1 py-3">
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
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 animate-top-bidder-glow rounded-full bg-amber-400/25 blur-2xl" />
          <HeroBadge />
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-snug font-medium text-amber-800 dark:text-amber-300">
        {HERO_MESSAGE}
      </p>
    </div>
  );
}
