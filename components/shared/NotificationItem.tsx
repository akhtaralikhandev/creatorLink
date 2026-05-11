"use client";

import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import Link from "next/link";

interface NotificationItemProps {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: Date | string;
  linkHref?: string | null;
  onMarkRead?: (id: string) => void;
}

export function NotificationItem({ id, message, isRead, createdAt, linkHref, onMarkRead }: NotificationItemProps) {
  const inner = (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors",
        isRead
          ? "hover:bg-muted/50"
          : "bg-primary/5 border-l-2 border-primary hover:bg-primary/10"
      )}
      onClick={() => !isRead && onMarkRead?.(id)}
    >
      <div className={cn(
        "mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0",
        isRead ? "bg-muted" : "bg-primary/10"
      )}>
        <Bell className={cn("h-3.5 w-3.5", isRead ? "text-muted-foreground" : "text-primary")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm leading-snug", isRead ? "text-muted-foreground" : "text-foreground font-medium")}>
          {message}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(createdAt)}</p>
      </div>
      {!isRead && (
        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
      )}
    </div>
  );

  if (linkHref) return <Link href={linkHref}>{inner}</Link>;
  return inner;
}
