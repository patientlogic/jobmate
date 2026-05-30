"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumberCardToggleProps {
  title: string;
  metricLabel: string;
  href: string;
  data: {
    label: string;
    num: number;
    trend: number;
  }[];
}

export default function NumberCardToggle({
  title,
  metricLabel,
  href,
  data,
}: NumberCardToggleProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = data[activeIndex];

  const cardBody = (
    <>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-green-600">
            {title}
          </CardTitle>
          <div className="flex rounded-md border text-xs">
            {data.map((item, index) => (
              <button
                key={item.label}
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setActiveIndex(index);
                }}
                className={cn(
                  "px-2 py-1 transition-colors",
                  index === 0 && "rounded-l-md",
                  index === data.length - 1 && "rounded-r-md",
                  activeIndex === index
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                {item.label.replace("Last ", "")}
              </button>
            ))}
          </div>
        </div>
        <CardTitle className="text-4xl">
          {current.num}{" "}
          <span className="text-xs text-muted-foreground">{metricLabel}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 text-xs text-muted-foreground">
          {current.trend}%{" "}
          {current.trend > 0 ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Progress
          value={current.trend}
          aria-label={`${current.trend}% increase`}
        />
      </CardFooter>
    </>
  );

  return (
    <Link
      href={href}
      className="block rounded-lg transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`View ${title.toLowerCase()}`}
    >
      <Card className="h-full border-transparent shadow-none hover:border-border">
        {cardBody}
      </Card>
    </Link>
  );
}
