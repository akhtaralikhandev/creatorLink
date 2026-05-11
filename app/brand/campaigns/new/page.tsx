"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createCampaign } from "@/actions/campaigns";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

// Form-specific schema — budget stays as string; conversion happens server-side
const campaignSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().max(5000).optional(),
  budget: z.string().optional(),
  niche: z.string().max(100).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]),
  coverImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

export default function NewCampaignPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    setError,
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      status: "DRAFT",
    },
  });

  const statusValue = watch("status");

  const onSubmit = (data: CampaignFormValues) => {
    startTransition(async () => {
      const result = await createCampaign(data);
      if (result?.error) {
        setError("root", { message: result.error });
        return;
      }
      router.push("/brand/campaigns");
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Create Campaign"
        description="Set up a new campaign to connect with creators."
        breadcrumb={
          <Link
            href="/brand/campaigns"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Campaigns
          </Link>
        }
      />

      <SectionCard title="Campaign Details">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Campaign Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Summer Product Launch 2025"
              {...register("title")}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your campaign goals, requirements, and target audience..."
              rows={5}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Budget & Niche row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (USD)</Label>
              <Input
                id="budget"
                type="number"
                min="1"
                step="0.01"
                placeholder="e.g. 500"
                {...register("budget")}
                aria-invalid={!!errors.budget}
              />
              {errors.budget && (
                <p className="text-sm text-destructive">{errors.budget.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="niche">Niche / Category</Label>
              <Input
                id="niche"
                placeholder="e.g. Beauty, Tech, Fitness"
                {...register("niche")}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={statusValue}
              onValueChange={(val) =>
                setValue("status", val as "DRAFT" | "ACTIVE" | "CLOSED")
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft — save but don't publish yet</SelectItem>
                <SelectItem value="ACTIVE">Active — open for applications</SelectItem>
                <SelectItem value="CLOSED">Closed — no new applications</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover Image URL</Label>
            <Input
              id="coverImage"
              type="url"
              placeholder="https://example.com/image.jpg"
              {...register("coverImage")}
              aria-invalid={!!errors.coverImage}
            />
            {errors.coverImage && (
              <p className="text-sm text-destructive">{errors.coverImage.message}</p>
            )}
          </div>

          {/* Root error */}
          {errors.root && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive">{errors.root.message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isPending ? "Creating..." : "Create Campaign"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/brand/campaigns">Cancel</Link>
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
