import { getBidderProfileForAdmin } from "@/actions/site-admin.actions";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import BidderJobsTable from "@/components/site-admin/BidderJobsTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Metadata } from "next";

type PageProps = {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { userId } = await props.params;
  try {
    const profile = await getBidderProfileForAdmin(userId);
    return {
      title: profile ? `Monitor ${profile.name} | JobMate` : "Bidder monitoring",
    };
  } catch {
    return { title: "Bidder monitoring" };
  }
}

export default async function SiteAdminBidderPage(props: PageProps) {
  const { userId } = await props.params;
  const { page: pageParam } = await props.searchParams;

  let profile;
  try {
    profile = await getBidderProfileForAdmin(userId);
  } catch {
    notFound();
  }

  if (!profile) {
    notFound();
  }

  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  return (
    <div className="col-span-3 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-1" asChild>
            <Link href="/dashboard/site-admin">← All job seekers</Link>
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">
            Monitoring: {profile.name}
          </h1>
          <p className="text-muted-foreground text-sm">{profile.email}</p>
        </div>
      </div>

      <DashboardOverview subjectUserId={userId} />

      <section className="space-y-2">
        <h2 className="text-lg font-medium tracking-tight">Jobs tracked</h2>
        <p className="text-muted-foreground text-sm">
          Paginated applications and drafts for this account (read-only).
        </p>
        <BidderJobsTable userId={userId} page={page} />
      </section>
    </div>
  );
}
