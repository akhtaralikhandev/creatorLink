"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyToCampaign } from "@/actions/applications";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Send, Loader2 } from "lucide-react";

interface ApplyButtonProps {
  campaignId: string;
  campaignTitle: string;
}

export function ApplyButton({ campaignId, campaignTitle }: ApplyButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [pitch, setPitch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await applyToCampaign({ campaignId, pitch });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setPitch("");
        router.refresh();
      }, 1200);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full">
          <Send className="h-3.5 w-3.5 mr-2" />
          Apply Now
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply to Campaign</DialogTitle>
          <DialogDescription>
            You are applying to: <span className="font-medium text-foreground">{campaignTitle}</span>
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center">
            <div className="h-12 w-12 rounded-full bg-success-muted flex items-center justify-center mx-auto mb-3">
              <Send className="h-6 w-6 text-success" />
            </div>
            <p className="text-sm font-medium text-foreground">Application submitted!</p>
            <p className="text-xs text-muted-foreground mt-1">The brand will review your application.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 py-2">
              <Label htmlFor="pitch">
                Your Pitch <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Textarea
                id="pitch"
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                placeholder="Introduce yourself, explain why you're a great fit for this campaign, and share any relevant experience..."
                rows={5}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">{pitch.length}/2000</p>
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
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                {isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
