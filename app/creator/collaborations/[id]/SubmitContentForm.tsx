"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitContent } from "@/actions/collaborations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, CheckCircle } from "lucide-react";

interface SubmitContentFormProps {
  collaborationId: string;
}

export function SubmitContentForm({ collaborationId }: SubmitContentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [videoUrl, setVideoUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!videoUrl.trim()) {
      setError("Please provide a content URL.");
      return;
    }

    startTransition(async () => {
      const result = await submitContent({
        collaborationId,
        videoUrl: videoUrl.trim(),
        caption: caption.trim() || undefined,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setVideoUrl("");
      setCaption("");
      setTimeout(() => {
        setSuccess(false);
        router.refresh();
      }, 1500);
    });
  };

  if (success) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-success-muted border border-success/20">
        <CheckCircle className="h-5 w-5 text-success shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Content submitted successfully!</p>
          <p className="text-xs text-muted-foreground">The brand will review your submission.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="videoUrl">
          Content URL <span className="text-destructive">*</span>
        </Label>
        <Input
          id="videoUrl"
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://www.instagram.com/p/... or https://www.tiktok.com/@..."
          required
        />
        <p className="text-xs text-muted-foreground">
          Paste the link to your published content (AtSign, TikTok, YouTube, etc.)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="caption">
          Caption / Notes <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Textarea
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add any context, the caption you used, or notes for the brand..."
          rows={3}
          maxLength={2000}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        {isPending ? "Submitting..." : "Submit Content"}
      </Button>
    </form>
  );
}
