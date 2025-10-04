"use client";

import * as React from "react";
import { Search, Rows2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type TableDensity = "comfortable" | "compact";

export interface TableToolbarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterLabel?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: Array<{ label: string; value: string }>;
  density: TableDensity;
  onDensityChange: (density: TableDensity) => void;
  className?: string;
  children?: React.ReactNode;
}

export function TableToolbar({
  searchPlaceholder = "Search",
  searchValue,
  onSearchChange,
  filterLabel,
  filterValue,
  onFilterChange,
  filterOptions,
  density,
  onDensityChange,
  className,
  children,
}: TableToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-center md:justify-between", className)}>
      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={event => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
          />
        </div>
        {filterOptions && filterOptions.length > 0 && onFilterChange ? (
          <div className="md:w-48">
            {filterLabel ? <Label className="sr-only">{filterLabel}</Label> : null}
            <Select value={filterValue} onValueChange={onFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder={filterLabel ?? "Filter"} />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant={density === "comfortable" ? "default" : "outline"}
          size="sm"
          onClick={() => onDensityChange("comfortable")}
        >
          <Rows2 className="mr-2 h-4 w-4" /> Comfort
        </Button>
        <Button
          variant={density === "compact" ? "default" : "outline"}
          size="sm"
          onClick={() => onDensityChange("compact")}
        >
          <Rows2 className="mr-2 h-4 w-4 rotate-90" /> Compact
        </Button>
      </div>
    </div>
  );
}
