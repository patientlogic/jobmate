import { listJobBidders } from "@/actions/site-admin.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRole } from "@prisma/client";
import { format } from "date-fns";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Site administration | JobMate",
};

export default async function SiteAdminPage() {
  const bidders = await listJobBidders();

  return (
    <div className="col-span-3 space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Site administration</h1>
        <p className="text-muted-foreground text-sm">
          Administrators can monitor each registered job seeker&apos;s dashboard metrics
          and applications. Regular users cannot access this section.
        </p>
      </div>
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Role</TableHead>
              <TableHead className="text-right">Applied jobs</TableHead>
              <TableHead className="text-right">All tracked jobs</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bidders.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  <Link
                    className="text-primary underline-offset-4 hover:underline"
                    href={`/dashboard/site-admin/${u.id}`}
                  >
                    {u.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      u.role === UserRole.ADMIN
                        ? "text-primary font-medium"
                        : undefined
                    }
                  >
                    {u.role === UserRole.ADMIN ? "Admin" : "User"}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {u.jobsAppliedCount}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {u.jobsTotal}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(u.createdAt, "PP")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {bidders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users yet.</p>
      ) : null}
    </div>
  );
}
