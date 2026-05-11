import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { EntityCard } from "@/components/shared/EntityCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, getInitials, truncate } from "@/lib/utils";
import { ReviewApplicationButton } from "./ReviewApplicationButton";
import { Users, Pencil, ArrowLeft, AtSign, Globe } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const brand = await db.brand.findUnique({ where: { userId: session.user.id } });
  if (!brand) redirect("/onboarding");

  const campaign = await db.campaign.findFirst({
    where: { id, brandId: brand.id },
    include: {
      applications: {
        orderBy: { appliedAt: "desc" },
        include: {
          creator: {
            include: {
              portfolioItems: { take: 1 },
            },
          },
          collaboration: { select: { id: true } },
        },
      },
    },
  });

  if (!campaign) notFound();

  const pendingCount = campaign.applications.filter((a) => a.status === "PENDING").length;
  const acceptedCount = campaign.applications.filter((a) => a.status === "ACCEPTED").length;
  const rejectedCount = campaign.applications.filter((a) => a.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={campaign.title}
        description={campaign.niche ? `Niche: ${campaign.niche}` : undefined}
        breadcrumb={
          <Link
            href="/brand/campaigns"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Campaigns
          </Link>
        }
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/brand/campaigns/${campaign.id}/edit`}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Edit
              </Link>
            </Button>
          </div>
        }
      />

      {/* Campaign info card */}
      <SectionCard title="Campaign Information">
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={campaign.status} context="campaign" />
            {campaign.budget && (
              <span className="text-sm font-medium text-muted-foreground">
                Budget: <span className="text-foreground">{formatCurrency(Number(campaign.budget))}</span>
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              Created {formatDate(campaign.createdAt)}
            </span>
          </div>

          {campaign.description && (
            <>
              <Separator />
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {campaign.description}
              </p>
            </>
          )}

          {campaign.coverImage && (
            <div className="mt-4 rounded-lg overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={campaign.coverImage}
                alt={`${campaign.title} cover`}
                className="w-full max-h-64 object-cover"
              />
            </div>
          )}
        </div>
      </SectionCard>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending"
          value={pendingCount}
          icon={Users}
          variant="warning"
          subtitle="Awaiting review"
        />
        <StatCard
          title="Accepted"
          value={acceptedCount}
          icon={Users}
          variant="success"
          subtitle="Active collaborations started"
        />
        <StatCard
          title="Rejected"
          value={rejectedCount}
          icon={Users}
          variant="destructive"
          subtitle="Not selected"
        />
      </div>

      {/* Applications */}
      <SectionCard
        title="Applications"
        description={`${campaign.applications.length} creator${campaign.applications.length !== 1 ? "s" : ""} applied`}
      >
        {campaign.applications.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No applications yet"
            description="When creators apply to this campaign, they'll appear here."
          />
        ) : (
          <div className="space-y-4">
            {campaign.applications.map((application) => (
              <div
                key={application.id}
                className="rounded-lg border border-border p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
                      {getInitials(application.creator.displayName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          {application.creator.displayName}
                        </span>
                        <StatusBadge status={application.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {application.creator.niche && (
                          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                            {application.creator.niche}
                          </span>
                        )}
                        {application.creator.instagramHandle && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <AtSign className="h-3 w-3" />
                            @{application.creator.instagramHandle}
                          </span>
                        )}
                        {application.creator.country && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            {application.creator.country}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Applied {formatDate(application.appliedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {application.collaboration && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/brand/collaborations/${application.collaboration.id}`}>
                          View Collab
                        </Link>
                      </Button>
                    )}
                    {application.status === "PENDING" && (
                      <ReviewApplicationButton
                        applicationId={application.id}
                        campaignBudget={campaign.budget ? Number(campaign.budget) : undefined}
                      />
                    )}
                  </div>
                </div>

                {application.pitch && (
                  <div className="bg-muted/50 rounded-md px-3 py-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Pitch</p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {truncate(application.pitch, 300)}
                    </p>
                  </div>
                )}

                {application.creator.portfolioItems.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Portfolio: {application.creator.portfolioItems.length} item{application.creator.portfolioItems.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
