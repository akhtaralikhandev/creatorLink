"use client";

import { useState, useTransition } from "react";
import { reviewSubmission } from "@/actions/collaborations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ReviewSubmissionButtonProps {
  submissionId: string;
}

export function ReviewSubmissionButton({ submissionId }: ReviewSubmissionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleOpen = (act: "APPROVED" | "REJECTED") => {
    setAction(act);
    setFeedback("");
    setError(null);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!action) return;
    setError(null);
    startTransition(async () => {
      const result = await reviewSubmission({
        submissionId,
        status: action,
        feedback: feedback.trim() || undefined,
      });
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
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => handleOpen("REJECTED")}
          disabled={isPending}
        >
          <XCircle className="h-3.5 w-3.5 mr-1.5" />
          Request Revision
        </Button>
        <Button
          size="sm"
          onClick={() => handleOpen("APPROVED")}
          disabled={isPending}
        >
          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
          Approve
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "APPROVED" ? "Approve Submission" : "Request Revision"}
            </DialogTitle>
            <DialogDescription>
              {action === "APPROVED"
                ? "Approving this submission will mark the collaboration as completed and release payment to the creator."
                : "Request a revision from the creator. Add feedback to help them improve."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="feedback">
              Feedback {action === "REJECTED" && <span className="text-muted-foreground">(recommended)</span>}
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                action === "APPROVED"
                  ? "Optional: add a note for the creator..."
                  : "Describe what needs to be changed or improved..."
              }
              rows={4}
            />
          </div>

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
              {action === "APPROVED" ? "Approve & Release Payment" : "Send Revision Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
