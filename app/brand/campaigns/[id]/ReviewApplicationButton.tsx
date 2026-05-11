"use client";

import { useState, useTransition } from "react";
import { reviewApplication } from "@/actions/applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ReviewApplicationButtonProps {
  applicationId: string;
  campaignBudget?: number;
}

export function ReviewApplicationButton({ applicationId, campaignBudget }: ReviewApplicationButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"ACCEPTED" | "REJECTED" | null>(null);
  const [agreedRate, setAgreedRate] = useState<string>(campaignBudget?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleAction = (act: "ACCEPTED" | "REJECTED") => {
    setAction(act);
    setError(null);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!action) return;
    setError(null);
    startTransition(async () => {
      const payload: { applicationId: string; status: "ACCEPTED" | "REJECTED"; agreedRate?: number } = {
        applicationId,
        status: action,
      };
      if (action === "ACCEPTED" && agreedRate) {
        const parsed = parseFloat(agreedRate);
        if (isNaN(parsed) || parsed <= 0) {
          setError("Please enter a valid agreed rate.");
          return;
        }
        payload.agreedRate = parsed;
      }
      const result = await reviewApplication(payload);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive border-destructive/30 hover:bg-destructive/10"
        onClick={() => handleAction("REJECTED")}
        disabled={isPending}
      >
        <XCircle className="h-3.5 w-3.5 mr-1.5" />
        Reject
      </Button>
      <Button
        size="sm"
        onClick={() => handleAction("ACCEPTED")}
        disabled={isPending}
      >
        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
        Accept
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "ACCEPTED" ? "Accept Application" : "Reject Application"}
            </DialogTitle>
            <DialogDescription>
              {action === "ACCEPTED"
                ? "Confirm the agreed rate for this collaboration. A collaboration will be created automatically."
                : "This will reject the application and notify the creator."}
            </DialogDescription>
          </DialogHeader>

          {action === "ACCEPTED" && (
            <div className="space-y-2 py-2">
              <Label htmlFor="agreedRate">Agreed Rate (USD)</Label>
              <Input
                id="agreedRate"
                type="number"
                min="1"
                step="0.01"
                value={agreedRate}
                onChange={(e) => setAgreedRate(e.target.value)}
                placeholder={campaignBudget?.toString() ?? "Enter amount"}
              />
              <p className="text-xs text-muted-foreground">
                Leave as campaign budget or adjust as agreed.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              variant={action === "REJECTED" ? "destructive" : "default"}
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
              {action === "ACCEPTED" ? "Confirm & Accept" : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
