"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getTodayJobBidsLeaderboard,
  type TodayJobBidsLeaderboard,
} from "@/actions/jobBidsLeaderboard.actions";

const POLL_INTERVAL_MS = 30_000;

type JobBidsLeaderboardContextValue = {
  stats: TodayJobBidsLeaderboard | null;
  isLoading: boolean;
  isViewerTopBidder: boolean;
  showBidEncouragement: boolean;
};

const JobBidsLeaderboardContext =
  createContext<JobBidsLeaderboardContextValue | null>(null);

export function JobBidsLeaderboardProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<TodayJobBidsLeaderboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const data = await getTodayJobBidsLeaderboard();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
    const intervalId = window.setInterval(() => {
      void loadStats();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [loadStats]);

  const isViewerTopBidder = useMemo(
    () => stats?.topBidders.some((bidder) => bidder.isViewer) ?? false,
    [stats],
  );

  const showBidEncouragement = stats?.showBidEncouragement ?? false;

  const value = useMemo(
    () => ({
      stats,
      isLoading,
      isViewerTopBidder,
      showBidEncouragement,
    }),
    [stats, isLoading, isViewerTopBidder, showBidEncouragement],
  );

  return (
    <JobBidsLeaderboardContext.Provider value={value}>
      {children}
    </JobBidsLeaderboardContext.Provider>
  );
}

export function useJobBidsLeaderboard() {
  const context = useContext(JobBidsLeaderboardContext);
  if (!context) {
    throw new Error(
      "useJobBidsLeaderboard must be used within JobBidsLeaderboardProvider",
    );
  }
  return context;
}
