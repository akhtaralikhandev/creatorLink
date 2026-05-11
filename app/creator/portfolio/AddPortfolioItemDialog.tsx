"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPortfolioItem } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

export function AddPortfolioItemDialog() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);

    if (!mediaUrl.trim()) {
      setError("Please enter a media URL.");
      return;
    }

    startTransition(async () => {
      const result = await addPortfolioItem({
        mediaUrl: mediaUrl.trim(),
        mediaType,
        caption: caption.trim() || undefined,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      setOpen(false);
      setMediaUrl("");
      setCaption("");
      setMediaType("IMAGE");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Portfolio Item</DialogTitle>
          <DialogDescription>
            Add an image or video to showcase your work to brands.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="mediaUrl">
              Media URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mediaUrl"
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://example.com/your-work.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mediaType">Media Type</Label>
            <Select
              value={mediaType}
              onValueChange={(val) => setMediaType(val as "IMAGE" | "VIDEO")}
            >
              <SelectTrigger id="mediaType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IMAGE">Image</SelectItem>
                <SelectItem value="VIDEO">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">
              Caption <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe this piece of work..."
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground text-right">{caption.length}/300</p>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
            {isPending ? "Adding..." : "Add to Portfolio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
