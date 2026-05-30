"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { JobBidderSummary } from "@/actions/site-admin.actions";
import { ALL_USERS_SUBJECT_ID } from "@/lib/admin-scope.constants";

export type AdminUserSelectorValue = "self" | typeof ALL_USERS_SUBJECT_ID | string;

type AdminUserSelectorProps = {
  users: JobBidderSummary[];
  value: AdminUserSelectorValue;
  onValueChange: (value: AdminUserSelectorValue) => void;
  selfLabel?: string;
  className?: string;
  "aria-label"?: string;
};

function AdminUserSelector({
  users,
  value,
  onValueChange,
  selfLabel = "My jobs",
  className,
  "aria-label": ariaLabel = "Select user jobs",
}: AdminUserSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    if (value === "self") return selfLabel;
    if (value === ALL_USERS_SUBJECT_ID) return "All Users";
    return users.find((user) => user.id === value)?.name ?? "Select user";
  }, [value, users, selfLabel]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          className={cn("h-8 w-[220px] justify-between font-normal", className)}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all users"
                onSelect={() => {
                  onValueChange(ALL_USERS_SUBJECT_ID);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === ALL_USERS_SUBJECT_ID ? "opacity-100" : "opacity-0",
                  )}
                />
                All Users
              </CommandItem>
              <CommandItem
                value={selfLabel}
                onSelect={() => {
                  onValueChange("self");
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === "self" ? "opacity-100" : "opacity-0",
                  )}
                />
                {selfLabel}
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Users">
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.name} ${user.email}`}
                  onSelect={() => {
                    onValueChange(user.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === user.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{user.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { AdminUserSelector };
