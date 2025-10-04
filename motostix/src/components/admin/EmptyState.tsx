"use client";

import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
  icon?: ReactNode;
}

export function EmptyState({
  title = "No data",
  description = "There is nothing to show just yet.",
  className,
  icon,
}: EmptyStateProps) {
  return (
    <div className={cn("flex min-h-[200px] flex-col items-center justify-center gap-2 bg-muted/20 p-8 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        {icon ?? <Inbox className="h-6 w-6 text-muted-foreground" />}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
