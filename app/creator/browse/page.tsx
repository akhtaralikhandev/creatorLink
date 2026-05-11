import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, truncate } from "@/lib/utils";
import { ApplyButton } from "./ApplyButton";
import { Megaphone, DollarSign, Tag, Building2 } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ q?: string; niche?: string }>;
}

export default async function CreatorBrowsePage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const searchQuery = params.q?.trim() ?? "";
  const nicheFilter = params.niche?.trim() ?? "";

  const creator = await db.creator.findUnique({ where: { userId: session.user.id } });
  if (!creator) redirect("/onboarding");

  // Fetch active campaigns
  const campaigns = await db.campaign.findMany({
    where: {
      status: "ACTIVE",
      ...(searchQuery
        ? {
            OR: [
              { title: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
              { niche: { contains: searchQuery, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(nicheFilter ? { niche: { contains: nicheFilter, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      brand: { select: { companyName: true, industry: true, logoUrl: true } },
      _count: { select: { applications: true } },
    },
  });

  // Check which campaigns this creator has already applied to
  const existingApplications = await db.application.findMany({
    where: { creatorId: creator.id },
    select: { campaignId: true, status: true },
  });
  const appliedMap = new Map(existingApplications.map((a) => [a.campaignId, a.status]));

  // Get all distinct niches for filter
  const nicheCampaigns = await db.campaign.findMany({
    where: { status: "ACTIVE", niche: { not: null } },
    select: { niche: true },
    distinct: ["niche"],
  });
  const niches = nicheCampaigns.map((c) => c.niche!).filter(Boolean).sort();

  const buildHref = (q?: string, niche?: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (niche) p.set("niche", niche);
    return `/creator/browse${p.toString() ? `?${p.toString()}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Browse Campaigns"
        description="Discover active campaigns from brands looking for creators like you."
      />

      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <form method="GET" action="/creator/browse" className="flex gap-2 max-w-sm">
          {nicheFilter && <input type="hidden" name="niche" value={nicheFilter} />}
          <input
            name="q"
            defaultValue={searchQuery}
            placeholder="Search campaigns..."
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        {/* Niche filter */}
        {niches.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Filter by niche:</span>
            <a href={buildHref(searchQuery, undefined)}>
              <Badge variant={!nicheFilter ? "secondary" : "outline"} className="cursor-pointer">
                All
              </Badge>
            </a>
            {niches.map((niche) => (
              <a key={niche} href={buildHref(searchQuery, niche)}>
                <Badge
                  variant={nicheFilter === niche ? "secondary" : "outline"}
                  className="cursor-pointer"
                >
                  {niche}
                </Badge>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Campaign count */}
      <p className="text-sm text-muted-foreground">
        {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} found
        {(searchQuery || nicheFilter) && " for your filters"}
      </p>

      {campaigns.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Megaphone}
            title="No campaigns found"
            description={
              searchQuery || nicheFilter
                ? "Try adjusting your search or removing filters."
                : "No active campaigns right now. Check back soon!"
            }
          />
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map((campaign) => {
            const appliedStatus = appliedMap.get(campaign.id);
            const hasApplied = !!appliedStatus;

            return (
              <div
                key={campaign.id}
                className="rounded-xl border border-border bg-card overflow-hidden flex flex-col hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                {/* Cover image placeholder */}
                <div className="h-36 bg-muted relative overflow-hidden">
                  {campaign.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={campaign.coverImage}
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Megaphone className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <StatusBadge status="ACTIVE" context="campaign" />
                  </div>
                  {hasApplied && (
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={appliedStatus} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm leading-tight">
                      {campaign.title}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3 shrink-0" />
                      <span>{campaign.brand.companyName}</span>
                      {campaign.brand.industry && (
                        <>
                          <span>·</span>
                          <span>{campaign.brand.industry}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {campaign.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {truncate(campaign.description, 120)}
                    </p>
                  )}

                  <div className="flex items-center gap-3 flex-wrap mt-auto">
                    {campaign.budget && (
                      <span className="flex items-center gap-1 text-xs font-medium text-foreground">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {formatCurrency(Number(campaign.budget))}
                      </span>
                    )}
                    {campaign.niche && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Tag className="h-3 w-3" />
                        {campaign.niche}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {campaign._count.applications} applied
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border">
                    {hasApplied ? (
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        Already Applied ({appliedStatus?.toLowerCase()})
                      </Button>
                    ) : (
                      <ApplyButton
                        campaignId={campaign.id}
                        campaignTitle={campaign.title}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
