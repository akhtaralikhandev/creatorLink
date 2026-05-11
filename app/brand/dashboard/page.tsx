import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { SectionCard } from "@/components/shared/SectionCard";
import { EntityCard } from "@/components/shared/EntityCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { Megaphone, Users, Briefcase, DollarSign, Plus, ArrowRight } from "lucide-react";

export default async function BrandDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const brand = await db.brand.findUnique({
    where: { userId: session.user.id },
    include: {
      campaigns: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          _count: { select: { applications: true } },
        },
      },
    },
  });

  if (!brand) redirect("/onboarding");

  // Aggregate stats
  const [totalCampaigns, activeCampaigns, totalApplications, paidTotal] = await Promise.all([
    db.campaign.count({ where: { brandId: brand.id } }),
    db.campaign.count({ where: { brandId: brand.id, status: "ACTIVE" } }),
    db.application.count({
      where: { campaign: { brandId: brand.id } },
    }),
    db.payment.aggregate({
      where: {
        status: "PAID",
        collaboration: {
          application: { campaign: { brandId: brand.id } },
        },
      },
      _sum: { amount: true },
    }),
  ]);

  // Recent applications
  const recentApplications = await db.application.findMany({
    where: { campaign: { brandId: brand.id } },
    orderBy: { appliedAt: "desc" },
    take: 5,
    include: {
      campaign: { select: { title: true } },
      creator: { select: { displayName: true, niche: true, profileImageUrl: true } },
    },
  });

  const paidAmount = paidTotal._sum.amount ? Number(paidTotal._sum.amount) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${brand.companyName}`}
        description="Here's an overview of your campaigns and creator activity."
        action={
          <Button asChild>
            <Link href="/brand/campaigns/new">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Link>
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Campaigns"
          value={totalCampaigns}
          icon={Megaphone}
          variant="primary"
          subtitle="All time"
        />
        <StatCard
          title="Active Campaigns"
          value={activeCampaigns}
          icon={Megaphone}
          variant="success"
          subtitle="Currently running"
        />
        <StatCard
          title="Total Applications"
          value={totalApplications}
          icon={Users}
          variant="warning"
          subtitle="Across all campaigns"
        />
        <StatCard
          title="Total Paid Out"
          value={formatCurrency(paidAmount)}
          icon={DollarSign}
          variant="default"
          subtitle="To creators"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent campaigns */}
        <SectionCard
          title="Recent Campaigns"
          description="Your most recently created campaigns"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/brand/campaigns">
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          }
        >
          {brand.campaigns.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No campaigns yet"
              description="Create your first campaign to start working with creators."
              action={{ label: "Create Campaign", href: "/brand/campaigns/new" }}
            />
          ) : (
            <div className="space-y-3">
              {brand.campaigns.map((campaign) => (
                <Link key={campaign.id} href={`/brand/campaigns/${campaign.id}`} className="block">
                  <EntityCard
                    title={campaign.title}
                    subtitle={campaign.niche ?? undefined}
                    meta={`${campaign._count.applications} application${campaign._count.applications !== 1 ? "s" : ""} · ${formatDate(campaign.createdAt)}`}
                    status={campaign.status}
                    statusContext="campaign"
                    tags={campaign.budget ? [formatCurrency(Number(campaign.budget))] : undefined}
                  />
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Recent applications */}
        <SectionCard
          title="Recent Applications"
          description="Creators who recently applied to your campaigns"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/brand/applications">
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          }
        >
          {recentApplications.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No applications yet"
              description="When creators apply to your campaigns, they'll appear here."
            />
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app) => (
                <Link key={app.id} href={`/brand/campaigns/${app.campaignId}`} className="block">
                  <EntityCard
                    title={app.creator.displayName}
                    subtitle={`Applied to: ${app.campaign.title}`}
                    meta={formatDate(app.appliedAt)}
                    status={app.status}
                    initials={getInitials(app.creator.displayName)}
                    image={app.creator.profileImageUrl}
                    tags={app.creator.niche ? [app.creator.niche] : undefined}
                  />
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Quick links */}
      <SectionCard title="Quick Actions">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/brand/campaigns/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/brand/applications">
              <Users className="h-4 w-4 mr-2" />
              Review Applications
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/brand/collaborations">
              <Briefcase className="h-4 w-4 mr-2" />
              View Collaborations
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/brand/reports">
              <DollarSign className="h-4 w-4 mr-2" />
              Reports
            </Link>
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
