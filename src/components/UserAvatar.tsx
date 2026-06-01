"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CurrentUser } from "@/models/user.model";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function UserAvatar({ user }: { user: CurrentUser | null }) {
  if (!user) return null;

  const label = user.displayName?.trim() || user.name || user.email;

  return (
    <Avatar className="h-9 w-9">
      {user.avatarUrl ? (
        <AvatarImage src={user.avatarUrl} alt={label} />
      ) : null}
      <AvatarFallback className="text-xs font-semibold">
        {getInitials(label) || "U"}
      </AvatarFallback>
    </Avatar>
  );
}
