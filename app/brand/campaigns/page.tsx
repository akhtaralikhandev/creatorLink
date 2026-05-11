import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { EntityCard } from "@/components/shared/EntityCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionCard } from "@/components/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Megaphone, Plus } from "lucide-react";
import type { CampaignStatus } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Draft", value: "DRAFT" },
  { label: "Closed", value: "CLOSED" },
];

export default async function BrandCampaignsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const statusFilter = params.status as CampaignStatus | undefined;
  const searchQuery = params.q?.trim() ?? "";

  const brand = await db.brand.findUnique({ where: { userId: session.user.id } });
  if (!brand) redirect("/onboarding");

  const campaigns = await db.campaign.findMany({
    where: {
      brandId: brand.id,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(searchQuery
        ? {
            OR: [
              { title: { contains: searchQuery, mode: "insensitive" } },
              { niche: { contains: searchQuery, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { applications: true } },
    },
  });

  const [totalCount, activeCount, draftCount, closedCount] = await Promise.all([
    db.campaign.count({ where: { brandId: brand.id } }),
    db.campaign.count({ where: { brandId: brand.id, status: "ACTIVE" } }),
    db.campaign.count({ where: { brandId: brand.id, status: "DRAFT" } }),
    db.campaign.count({ where: { brandId: brand.id, status: "CLOSED" } }),
  ]);

  const buildHref = (status: string) => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (searchQuery) p.set("q", searchQuery);
    return `/brand/campaigns${p.toString() ? `?${p.toString()}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Manage and track all your influencer campaigns."
        action={
          <Button asChild>
            <Link href="/brand/campaigns/new">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Link>
          </Button>
        }
      />

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_OPTIONS.map((opt) => {
          const count =
            opt.value === ""
              ? totalCount
              : opt.value === "ACTIVE"
                ? activeCount
                : opt.value === "DRAFT"
                  ? draftCount
                  : closedCount;
          const isActive = (statusFilter ?? "") === opt.value;
          return (
            <Link key={opt.value} href={buildHref(opt.value)}>
              <Badge
                variant={isActive ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-sm"
              >
                {opt.label}
                <span className="ml-1.5 opacity-70">{count}</span>
              </Badge>
            </Link>
          );
        })}
      </div>

      {/* Search form */}
      <form method="GET" action="/brand/campaigns" className="flex gap-2 max-w-sm">
        {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
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

      <SectionCard noPadding>
        {campaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title={searchQuery || statusFilter ? "No campaigns match your filters" : "No campaigns yet"}
            description={
              searchQuery || statusFilter
                ? "Try adjusting your search or filter criteria."
                : "Create your first campaign to start connecting with creators."
            }
            action={
              !searchQuery && !statusFilter
                ? { label: "Create Campaign", href: "/brand/campaigns/new" }
                : undefined
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-4">
                <EntityCard
                  title={campaign.title}
                  subtitle={campaign.description ? campaign.description.slice(0, 120) + (campaign.description.length > 120 ? "…" : "") : undefined}
                  meta={`${campaign._count.applications} application${campaign._count.applications !== 1 ? "s" : ""} · Created ${formatDate(campaign.createdAt)}`}
                  status={campaign.status}
                  statusContext="campaign"
                  tags={[
                    ...(campaign.niche ? [campaign.niche] : []),
                    ...(campaign.budget ? [formatCurrency(Number(campaign.budget))] : []),
                  ]}
                  action={
                    <div className="flex flex-col gap-2 items-end">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/brand/campaigns/${campaign.id}`}>View</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/brand/campaigns/${campaign.id}/edit`}>Edit</Link>
                      </Button>
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
