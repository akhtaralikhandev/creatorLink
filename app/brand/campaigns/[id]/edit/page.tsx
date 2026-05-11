"use client";

import { useEffect, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateCampaign } from "@/actions/campaigns";
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
import { useState } from "react";

const campaignSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().max(5000).optional(),
  budget: z.string().optional(),
  niche: z.string().max(100).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]),
  coverImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

interface CampaignData {
  id: string;
  title: string;
  description: string | null;
  budget: number | null;
  niche: string | null;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  coverImage: string | null;
}

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const campaignId = params.id;

  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
    setError,
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: { status: "DRAFT" },
  });

  const statusValue = watch("status");

  // Fetch campaign data client-side
  useEffect(() => {
    async function fetchCampaign() {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}`);
        if (!res.ok) {
          setFetchError("Campaign not found.");
          setLoading(false);
          return;
        }
        const data: CampaignData = await res.json();
        reset({
          title: data.title,
          description: data.description ?? "",
          budget: data.budget != null ? String(data.budget) : "",
          niche: data.niche ?? "",
          status: data.status,
          coverImage: data.coverImage ?? "",
        });
        setLoading(false);
      } catch {
        setFetchError("Failed to load campaign data.");
        setLoading(false);
      }
    }
    fetchCampaign();
  }, [campaignId, reset]);

  const onSubmit = (data: CampaignFormValues) => {
    startTransition(async () => {
      const result = await updateCampaign(campaignId, data);
      if (result?.error) {
        setError("root", { message: result.error });
        return;
      }
      router.push(`/brand/campaigns/${campaignId}`);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-2xl space-y-4">
        <PageHeader
          title="Edit Campaign"
          breadcrumb={
            <Link href="/brand/campaigns" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Campaigns
            </Link>
          }
        />
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
          <p className="text-sm text-destructive">{fetchError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Edit Campaign"
        description="Update your campaign details."
        breadcrumb={
          <Link
            href={`/brand/campaigns/${campaignId}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Campaign
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

          {/* Budget & Niche */}
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

          {errors.root && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive">{errors.root.message}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/brand/campaigns/${campaignId}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
