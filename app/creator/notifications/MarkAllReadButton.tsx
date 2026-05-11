"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAllNotificationsRead } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { CheckCheck, Loader2 } from "lucide-react";

export function MarkAllReadButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
      ) : (
        <CheckCheck className="h-3.5 w-3.5 mr-2" />
      )}
      Mark all as read
    </Button>
  );
}
