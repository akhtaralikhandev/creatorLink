import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { BarChart2, DollarSign, Users, Megaphone, AlertTriangle } from "lucide-react";

export default async function BrandReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const brand = await db.brand.findUnique({ where: { userId: session.user.id } });
  if (!brand) redirect("/onboarding");

  // 1. Active campaigns with budget
  const activeCampaigns = await db.campaign.findMany({
    where: { brandId: brand.id, status: "ACTIVE" },
    orderBy: { budget: "desc" },
    select: { id: true, title: true, budget: true, niche: true, createdAt: true },
  });

  // 2. Applications per campaign
  const applicationsPerCampaign = await db.campaign.findMany({
    where: { brandId: brand.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      _count: { select: { applications: true } },
    },
  });

  // 3. Collaborations per creator
  // Enrich with creator names
  const collabsWithCreator = await db.collaboration.findMany({
    where: { application: { campaign: { brandId: brand.id } } },
    select: {
      id: true,
      status: true,
      application: {
        select: {
          creator: { select: { id: true, displayName: true } },
        },
      },
    },
  });

  // Group by creator
  const creatorCollabMap: Record<string, { displayName: string; count: number; active: number; completed: number }> = {};
  for (const c of collabsWithCreator) {
    const creatorId = c.application.creator.id;
    if (!creatorCollabMap[creatorId]) {
      creatorCollabMap[creatorId] = {
        displayName: c.application.creator.displayName,
        count: 0,
        active: 0,
        completed: 0,
      };
    }
    creatorCollabMap[creatorId].count++;
    if (c.status === "ACTIVE") creatorCollabMap[creatorId].active++;
    if (c.status === "COMPLETED") creatorCollabMap[creatorId].completed++;
  }

  const creatorCollabs = Object.values(creatorCollabMap).sort((a, b) => b.count - a.count);

  // 4. Total paid per creator
  const payments = await db.payment.findMany({
    where: {
      status: "PAID",
      collaboration: { application: { campaign: { brandId: brand.id } } },
    },
    include: {
      collaboration: {
        include: {
          application: {
            include: { creator: { select: { displayName: true } } },
          },
        },
      },
    },
  });

  const paidPerCreator: Record<string, { displayName: string; total: number; count: number }> = {};
  for (const p of payments) {
    const name = p.collaboration.application.creator.displayName;
    if (!paidPerCreator[name]) paidPerCreator[name] = { displayName: name, total: 0, count: 0 };
    paidPerCreator[name].total += Number(p.amount);
    paidPerCreator[name].count++;
  }
  const paidPerCreatorList = Object.values(paidPerCreator).sort((a, b) => b.total - a.total);

  // 5. Campaigns with no accepted applications
  const campaignsNoAccepted = await db.campaign.findMany({
    where: {
      brandId: brand.id,
      applications: { none: { status: "ACCEPTED" } },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      _count: { select: { applications: true } },
    },
  });

  // 6. Top 3 creators by completed collabs
  const completedCollabsPerCreator: Record<string, { displayName: string; count: number }> = {};
  for (const c of collabsWithCreator.filter((c) => c.status === "COMPLETED")) {
    const name = c.application.creator.displayName;
    if (!completedCollabsPerCreator[name]) completedCollabsPerCreator[name] = { displayName: name, count: 0 };
    completedCollabsPerCreator[name].count++;
  }
  const top3Creators = Object.values(completedCollabsPerCreator)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // 7. Pending submissions older than 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oldPendingSubmissions = await db.contentSubmission.findMany({
    where: {
      status: "PENDING",
      submittedAt: { lt: sevenDaysAgo },
      collaboration: { application: { campaign: { brandId: brand.id } } },
    },
    orderBy: { submittedAt: "asc" },
    include: {
      collaboration: {
        include: {
          application: {
            include: {
              campaign: { select: { title: true } },
              creator: { select: { displayName: true } },
            },
          },
        },
      },
    },
  });

  // 8. Brand spending summary
  const totalBudgetAllocated = activeCampaigns.reduce(
    (sum, c) => sum + (c.budget ? Number(c.budget) : 0),
    0
  );
  const totalPaid = paidPerCreatorList.reduce((sum, c) => sum + c.total, 0);
  const pendingPayments = await db.payment.aggregate({
    where: {
      status: "PENDING",
      collaboration: { application: { campaign: { brandId: brand.id } } },
    },
    _sum: { amount: true },
  });
  const totalPending = Number(pendingPayments._sum.amount ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Detailed analytics and insights for your brand's campaigns and creator partnerships."
        action={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BarChart2 className="h-4 w-4" />
            Live data
          </div>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Campaigns"
          value={activeCampaigns.length}
          icon={Megaphone}
          variant="primary"
        />
        <StatCard
          title="Total Paid Out"
          value={formatCurrency(totalPaid)}
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="Pending Payments"
          value={formatCurrency(totalPending)}
          icon={DollarSign}
          variant="warning"
        />
        <StatCard
          title="Overdue Reviews"
          value={oldPendingSubmissions.length}
          icon={AlertTriangle}
          variant={oldPendingSubmissions.length > 0 ? "destructive" : "default"}
        />
      </div>

      {/* Section 1: Active campaigns with budget */}
      <SectionCard
        title="Active Campaigns"
        description="Currently running campaigns and their budgets"
      >
        {activeCampaigns.length === 0 ? (
          <EmptyState icon={Megaphone} title="No active campaigns" description="Activate a campaign to see it here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Campaign</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Niche</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Budget</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeCampaigns.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5 pr-4 font-medium text-foreground">{c.title}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{c.niche ?? "—"}</td>
                    <td className="py-2.5 pr-4 text-foreground font-medium">
                      {c.budget ? formatCurrency(Number(c.budget)) : "—"}
                    </td>
                    <td className="py-2.5 text-muted-foreground">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Section 2: Applications per campaign */}
      <SectionCard
        title="Applications per Campaign"
        description="How many creators have applied to each campaign"
      >
        {applicationsPerCampaign.length === 0 ? (
          <EmptyState icon={Users} title="No campaigns yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Campaign</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Applications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applicationsPerCampaign.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5 pr-4 font-medium text-foreground">{c.title}</td>
                    <td className="py-2.5 pr-4">
                      <StatusBadge status={c.status} context="campaign" />
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="font-semibold text-foreground">{c._count.applications}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 3: Collaborations per creator */}
        <SectionCard
          title="Collaborations per Creator"
          description="All creators you've worked with"
        >
          {creatorCollabs.length === 0 ? (
            <EmptyState icon={Users} title="No collaborations yet" />
          ) : (
            <div className="space-y-2">
              {creatorCollabs.map((c) => (
                <div key={c.displayName} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm font-medium text-foreground">{c.displayName}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="text-success">{c.completed} completed</span>
                    <span className="text-primary">{c.active} active</span>
                    <span className="font-semibold text-foreground">{c.count} total</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Section 4: Total paid per creator */}
        <SectionCard
          title="Total Paid per Creator"
          description="Payment history by creator"
        >
          {paidPerCreatorList.length === 0 ? (
            <EmptyState icon={DollarSign} title="No payments made yet" />
          ) : (
            <div className="space-y-2">
              {paidPerCreatorList.map((c) => (
                <div key={c.displayName} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm font-medium text-foreground">{c.displayName}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{c.count} payment{c.count !== 1 ? "s" : ""}</span>
                    <span className="font-semibold text-foreground text-sm">{formatCurrency(c.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Section 5: Campaigns with no accepted applications */}
      <SectionCard
        title="Campaigns Without Accepted Applications"
        description="Campaigns that haven't moved to collaboration stage yet"
      >
        {campaignsNoAccepted.length === 0 ? (
          <p className="text-sm text-success py-4 text-center">All campaigns have accepted applications.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Campaign</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Total Applications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaignsNoAccepted.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5 pr-4 font-medium text-foreground">{c.title}</td>
                    <td className="py-2.5 pr-4">
                      <StatusBadge status={c.status} context="campaign" />
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">{c._count.applications}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 6: Top 3 creators */}
        <SectionCard
          title="Top Creators by Completed Collaborations"
          description="Your highest-performing creator partners"
        >
          {top3Creators.length === 0 ? (
            <EmptyState icon={Users} title="No completed collaborations yet" />
          ) : (
            <div className="space-y-3">
              {top3Creators.map((c, idx) => (
                <div key={c.displayName} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1">{c.displayName}</span>
                  <span className="text-sm font-semibold text-foreground">{c.count} completed</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Section 7: Pending submissions older than 7 days */}
        <SectionCard
          title="Overdue Pending Submissions"
          description="Submissions waiting for review for more than 7 days"
        >
          {oldPendingSubmissions.length === 0 ? (
            <p className="text-sm text-success py-4 text-center">No overdue submissions — all caught up!</p>
          ) : (
            <div className="space-y-3">
              {oldPendingSubmissions.map((s) => (
                <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {s.collaboration.application.creator.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.collaboration.application.campaign.title}
                    </p>
                    <p className="text-xs text-destructive mt-0.5">
                      Submitted {formatRelativeTime(s.submittedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Section 8: Brand spending summary */}
      <SectionCard
        title="Spending Summary"
        description="Overall financial overview for your brand"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Budget Allocated</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalBudgetAllocated)}</p>
            <p className="text-xs text-muted-foreground">Across {activeCampaigns.length} active campaigns</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Paid Out</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-muted-foreground">{payments.length} completed payment{payments.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending Payments</p>
            <p className="text-2xl font-bold text-warning">{formatCurrency(totalPending)}</p>
            <p className="text-xs text-muted-foreground">Awaiting submission approval</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
