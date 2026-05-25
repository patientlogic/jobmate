import DashboardOverview from "@/components/dashboard/DashboardOverview";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function Dashboard() {
  return <DashboardOverview />;
}
