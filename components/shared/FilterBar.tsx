"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  search?: string;
  onSearchChange?: (v: string) => void;
  placeholder?: string;
  filters?: {
    key: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (v: string) => void;
  }[];
  onClear?: () => void;
  className?: string;
}

export function FilterBar({ search, onSearchChange, placeholder = "Search…", filters, onClear, className }: FilterBarProps) {
  const hasFilters = (search && search.length > 0) || filters?.some((f) => f.value && f.value !== "all");

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {onSearchChange !== undefined && (
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="pl-8 h-9"
          />
        </div>
      )}

      {filters?.map((f) => (
        <Select key={f.key} value={f.value || "all"} onValueChange={f.onChange}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder={f.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {f.label}</SelectItem>
            {f.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {hasFilters && onClear && (
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
          <X className="h-3.5 w-3.5 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
