export function getBrowserTimeZone(): string {
  if (typeof Intl === "undefined") return "UTC";
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

const FALLBACK_TIME_ZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export type TimeZoneOption = {
  id: string;
  label: string;
  value: string;
};

export function formatTimeZoneLabel(timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const offset =
      parts.find((part) => part.type === "timeZoneName")?.value ?? "";
    const city = timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;
    return offset ? `${city} (${offset})` : city;
  } catch {
    return timeZone;
  }
}

export function getTimeZoneOptions(): TimeZoneOption[] {
  const zones =
    typeof Intl !== "undefined" && "supportedValuesOf" in Intl
      ? (Intl as typeof Intl & { supportedValuesOf: (key: string) => string[] })
          .supportedValuesOf("timeZone")
      : FALLBACK_TIME_ZONES;

  const browserZone = getBrowserTimeZone();

  return [...new Set([browserZone, ...zones])]
    .sort((a, b) => formatTimeZoneLabel(a).localeCompare(formatTimeZoneLabel(b)))
    .map((timeZone) => ({
      id: timeZone,
      label: formatTimeZoneLabel(timeZone),
      value: timeZone,
    }));
}

export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
};

export function utcToZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hours: read("hour") % 24,
    minutes: read("minute"),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const zonedDate = new Date(date.toLocaleString("en-US", { timeZone }));
  return zonedDate.getTime() - utcDate.getTime();
}

export function zonedPartsToUtc(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  const offset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  return new Date(utcGuess - offset);
}

export function formatUtcInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function zonedPartsToCalendarDate(parts: ZonedParts): Date {
  return new Date(parts.year, parts.month - 1, parts.day);
}

export function toTimeInputValue(parts: ZonedParts): string {
  return `${String(parts.hours).padStart(2, "0")}:${String(parts.minutes).padStart(2, "0")}`;
}
