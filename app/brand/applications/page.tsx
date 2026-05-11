import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDate, getInitials } from "@/lib/utils";
import { ReviewApplicationButton } from "@/app/brand/campaigns/[id]/ReviewApplicationButton";
import { Users, AtSign, Globe, Filter } from "lucide-react";

type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

interface PageProps {
  searchParams: Promise<{ status?: string; campaign?: string }>;
}

export default async function BrandApplicationsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const statusFilter = params.status as ApplicationStatus | undefined;
  const campaignFilter = params.campaign;

  const brand = await db.brand.findUnique({ where: { userId: session.user.id } });
  if (!brand) redirect("/onboarding");

  // Get all campaigns for filter dropdown
  const campaigns = await db.campaign.findMany({
    where: { brandId: brand.id },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  const applications = await db.application.findMany({
    where: {
      campaign: { brandId: brand.id },
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(campaignFilter ? { campaignId: campaignFilter } : {}),
    },
    orderBy: { appliedAt: "desc" },
    include: {
      campaign: { select: { id: true, title: true, budget: true } },
      creator: {
        select: {
          displayName: true,
          niche: true,
          instagramHandle: true,
          country: true,
          profileImageUrl: true,
        },
      },
      collaboration: { select: { id: true } },
    },
  });

  // Count by status
  const allCount = await db.application.count({ where: { campaign: { brandId: brand.id } } });
  const pendingCount = await db.application.count({ where: { campaign: { brandId: brand.id }, status: "PENDING" } });
  const acceptedCount = await db.application.count({ where: { campaign: { brandId: brand.id }, status: "ACCEPTED" } });
  const rejectedCount = await db.application.count({ where: { campaign: { brandId: brand.id }, status: "REJECTED" } });

  const STATUS_TABS = [
    { label: "All", value: "", count: allCount },
    { label: "Pending", value: "PENDING", count: pendingCount },
    { label: "Accepted", value: "ACCEPTED", count: acceptedCount },
    { label: "Rejected", value: "REJECTED", count: rejectedCount },
  ];

  const buildHref = (status: string, campaign?: string) => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (campaign) p.set("campaign", campaign);
    return `/brand/applications${p.toString() ? `?${p.toString()}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Review and manage all creator applications across your campaigns."
      />

      {/* Status filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => {
          const isActive = (statusFilter ?? "") === tab.value;
          return (
            <Link key={tab.value} href={buildHref(tab.value, campaignFilter)}>
              <Badge
                variant={isActive ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-sm"
              >
                {tab.label}
                <span className="ml-1.5 opacity-70">{tab.count}</span>
              </Badge>
            </Link>
          );
        })}
      </div>

      {/* Campaign filter */}
      {campaigns.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter by campaign:</span>
          <Link href={buildHref(statusFilter ?? "", undefined)}>
            <Badge variant={!campaignFilter ? "secondary" : "outline"} className="cursor-pointer">
              All campaigns
            </Badge>
          </Link>
          {campaigns.map((c) => (
            <Link key={c.id} href={buildHref(statusFilter ?? "", c.id)}>
              <Badge variant={campaignFilter === c.id ? "secondary" : "outline"} className="cursor-pointer">
                {c.title}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      <SectionCard noPadding>
        {applications.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No applications found"
            description={
              statusFilter || campaignFilter
                ? "No applications match the selected filters."
                : "When creators apply to your campaigns, they'll appear here."
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {applications.map((application) => (
              <div key={application.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
                      {getInitials(application.creator.displayName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          {application.creator.displayName}
                        </span>
                        <StatusBadge status={application.status} />
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Campaign:{" "}
                        <Link
                          href={`/brand/campaigns/${application.campaign.id}`}
                          className="text-primary hover:underline"
                        >
                          {application.campaign.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {application.creator.niche && (
                          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
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
                        campaignBudget={
                          application.campaign.budget
                            ? Number(application.campaign.budget)
                            : undefined
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
