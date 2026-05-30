"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listJobBidders,
  type JobBidderSummary,
} from "@/actions/site-admin.actions";
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
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import Loading from "../Loading";

function UsersContainer() {
  const [bidders, setBidders] = useState<JobBidderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listJobBidders();
      setBidders(data);
    } catch {
      setError("Failed to load users.");
      setBidders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <div className="col-span-3">
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <p className="text-muted-foreground text-sm">
            Monitor each registered job seeker&apos;s dashboard metrics and
            applications.
          </p>
        </CardHeader>
        <CardContent>
          {loading && <Loading />}
          {!loading && error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          {!loading && !error && bidders.length > 0 ? (
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
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>
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
          ) : null}
          {!loading && !error && bidders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default UsersContainer;
