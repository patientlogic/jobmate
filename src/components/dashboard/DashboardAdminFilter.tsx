"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  listJobBidders,
  type JobBidderSummary,
} from "@/actions/site-admin.actions";
import { AdminUserSelector } from "@/components/admin/AdminUserSelector";
import { ALL_USERS_SUBJECT_ID, isAllUsersScope } from "@/lib/admin-scope.constants";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

function DashboardAdminFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const queryParams = useSearchParams();
  const rawUserId = queryParams.get("userId");
  const isAllUsersView = !rawUserId || isAllUsersScope(rawUserId);
  const userSelectorValue = isAllUsersView
    ? ALL_USERS_SUBJECT_ID
    : rawUserId === "self"
      ? "self"
      : (rawUserId ?? ALL_USERS_SUBJECT_ID);

  const [users, setUsers] = useState<JobBidderSummary[]>([]);

  const selectedUser =
    rawUserId && !isAllUsersScope(rawUserId) && rawUserId !== "self"
      ? users.find((user) => user.id === rawUserId)
      : undefined;

  useEffect(() => {
    listJobBidders()
      .then(setUsers)
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Error!",
          description: "Failed to load users.",
        });
      });
  }, []);

  const onUserChange = (value: string) => {
    const params = new URLSearchParams(queryParams.toString());
    if (value === "self") {
      params.set("userId", "self");
    } else if (value === ALL_USERS_SUBJECT_ID) {
      params.delete("userId");
    } else {
      params.set("userId", value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <Card className="col-span-3">
      <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Dashboard</CardTitle>
          {isAllUsersView ? (
            <p className="text-sm text-muted-foreground">
              Viewing metrics for all users
            </p>
          ) : rawUserId === "self" ? (
            <p className="text-sm text-muted-foreground">Viewing your metrics</p>
          ) : selectedUser ? (
            <p className="text-sm text-muted-foreground">
              Viewing metrics for {selectedUser.name}
            </p>
          ) : null}
        </div>
        <AdminUserSelector
          users={users}
          value={userSelectorValue}
          onValueChange={onUserChange}
          selfLabel="My dashboard"
          aria-label="Select user dashboard"
        />
      </CardHeader>
    </Card>
  );
}

export { DashboardAdminFilter };
