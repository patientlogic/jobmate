import { getJobsList } from "@/actions/job.actions";
import { APP_CONSTANTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import Link from "next/link";

type BidderJobsTableProps = {
  userId: string;
  page: number;
};

export default async function BidderJobsTable({
  userId,
  page,
}: BidderJobsTableProps) {
  const res = await getJobsList(
    page,
    APP_CONSTANTS.RECORDS_PER_PAGE,
    undefined,
    undefined,
    undefined,
    false,
    undefined,
    undefined,
    undefined,
    userId,
  );

  if (!res?.success || !Array.isArray(res.data)) {
    return (
      <p className="text-sm text-muted-foreground">
        {typeof res?.message === "string" ? res.message : "Could not load jobs."}
      </p>
    );
  }

  const total =
    typeof res.total === "number" ? res.total : res.data.length;
  const totalPages = Math.max(1, Math.ceil(total / APP_CONSTANTS.RECORDS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead className="text-right">Applied date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {res.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No jobs for this user.
                </TableCell>
              </TableRow>
            ) : (
              res.data.map(
                (job: {
                  id: string;
                  JobTitle?: { label: string } | null;
                  Company?: { label: string } | null;
                  Status?: { label: string } | null;
                  applied?: boolean;
                  appliedDate?: Date | string | null;
                }) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {job.JobTitle?.label ?? "—"}
                    </TableCell>
                    <TableCell>{job.Company?.label ?? "—"}</TableCell>
                    <TableCell>{job.Status?.label ?? "—"}</TableCell>
                    <TableCell>{job.applied ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {job.appliedDate
                        ? format(new Date(job.appliedDate), "PP")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ),
              )
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">
          Page {currentPage} of {totalPages} ({total} total)
        </span>
        <div className="flex gap-2">
          {currentPage > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/dashboard/site-admin/${userId}?page=${currentPage - 1}`}
              >
                Previous
              </Link>
            </Button>
          ) : null}
          {currentPage < totalPages ? (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/dashboard/site-admin/${userId}?page=${currentPage + 1}`}
              >
                Next
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
