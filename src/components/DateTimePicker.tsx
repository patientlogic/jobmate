"use client";

import { Calendar as CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { ControllerRenderProps } from "react-hook-form";

import {
  formatUtcInTimeZone,
  getTimeZoneOptions,
  toTimeInputValue,
  utcToZonedParts,
  zonedPartsToCalendarDate,
  zonedPartsToUtc,
} from "@/lib/timezones";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FormControl } from "./ui/form";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface DateTimePickerProps {
  field: ControllerRenderProps<any, any>;
  timeZone: string;
  onTimeZoneChange: (timeZone: string) => void;
  isEnabled?: boolean;
}

export function DateTimePicker({
  field,
  timeZone,
  onTimeZoneChange,
  isEnabled = true,
}: DateTimePickerProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isTimeZoneOpen, setIsTimeZoneOpen] = useState(false);
  const timeZoneOptions = useMemo(() => getTimeZoneOptions(), []);

  const value = field.value instanceof Date ? field.value : undefined;
  const zonedParts = value
    ? utcToZonedParts(value, timeZone)
    : utcToZonedParts(new Date(), timeZone);

  const selectedTimeZoneLabel =
    timeZoneOptions.find((option) => option.value === timeZone)?.label ??
    timeZone;

  const updateZonedParts = (next: Partial<typeof zonedParts>) => {
    const merged = { ...zonedParts, ...next };
    field.onChange(
      zonedPartsToUtc(
        merged.year,
        merged.month,
        merged.day,
        merged.hours,
        merged.minutes,
        timeZone,
      ),
    );
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
            disabled={!isEnabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {value ? (
              <span className="truncate">
                {formatUtcInTimeZone(value, timeZone)} ({selectedTimeZoneLabel})
              </span>
            ) : (
              <span>Pick date, time, and timezone</span>
            )}
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-3" align="start">
        <div className="flex flex-col gap-3">
          <Calendar
            mode="single"
            selected={zonedPartsToCalendarDate(zonedParts)}
            onSelect={(nextDate) => {
              if (!nextDate) return;
              updateZonedParts({
                year: nextDate.getFullYear(),
                month: nextDate.getMonth() + 1,
                day: nextDate.getDate(),
              });
            }}
            className="rounded-md border"
          />

          <div className="space-y-2">
            <Label htmlFor={`${field.name}-time`}>Time</Label>
            <Input
              id={`${field.name}-time`}
              type="time"
              value={toTimeInputValue(zonedParts)}
              onChange={(event) => {
                const [hours, minutes] = event.target.value
                  .split(":")
                  .map(Number);
                if (Number.isNaN(hours) || Number.isNaN(minutes)) return;
                updateZonedParts({ hours, minutes });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Timezone</Label>
            <Popover open={isTimeZoneOpen} onOpenChange={setIsTimeZoneOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={isTimeZoneOpen}
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">{selectedTimeZoneLabel}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search timezone..." />
                  <CommandList>
                    <CommandEmpty>No timezone found.</CommandEmpty>
                    <CommandGroup>
                      {timeZoneOptions.map((option) => (
                        <CommandItem
                          key={option.id}
                          value={`${option.label} ${option.value}`}
                          onSelect={() => {
                            onTimeZoneChange(option.value);
                            setIsTimeZoneOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              timeZone === option.value
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
