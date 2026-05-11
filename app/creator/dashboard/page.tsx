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
import { NotificationItem } from "@/components/shared/NotificationItem";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import {
  FileText, Briefcase, DollarSign, Clock, ArrowRight, AtSign,
  Globe, Megaphone
} from "lucide-react";

export default async function CreatorDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const creator = await db.creator.findUnique({
    where: { userId: session.user.id },
    include: {
      portfolioItems: { select: { id: true } },
    },
  });

  if (!creator) redirect("/onboarding");

  // Stats
  const [totalApplications, activeCollabs, pendingSubmissions, earnings] = await Promise.all([
    db.application.count({ where: { creatorId: creator.id } }),
    db.collaboration.count({
      where: { application: { creatorId: creator.id }, status: "ACTIVE" },
    }),
    db.contentSubmission.count({
      where: {
        status: "PENDING",
        collaboration: { application: { creatorId: creator.id } },
      },
    }),
    db.payment.aggregate({
      where: {
        status: "PAID",
        collaboration: { application: { creatorId: creator.id } },
      },
      _sum: { amount: true },
    }),
  ]);

  const totalEarned = earnings._sum.amount ? Number(earnings._sum.amount) : 0;

  // Active collaborations preview
  const activeCollaborations = await db.collaboration.findMany({
    where: {
      application: { creatorId: creator.id },
      status: "ACTIVE",
    },
    take: 3,
    orderBy: { startedAt: "desc" },
    include: {
      application: {
        include: {
          campaign: {
            include: {
              brand: { select: { companyName: true } },
            },
          },
        },
      },
      contentSubmissions: { select: { id: true, status: true } },
      payment: { select: { status: true } },
    },
  });

  // Recent notifications
  const recentNotifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${creator.displayName}`}
        description="Here's an overview of your creator activity."
        action={
          <Button asChild>
            <Link href="/creator/browse">
              <Megaphone className="h-4 w-4 mr-2" />
              Browse Campaigns
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Applications Sent"
          value={totalApplications}
          icon={FileText}
          variant="primary"
          subtitle="All time"
        />
        <StatCard
          title="Active Collaborations"
          value={activeCollabs}
          icon={Briefcase}
          variant="success"
          subtitle="Currently in progress"
        />
        <StatCard
          title="Pending Submissions"
          value={pendingSubmissions}
          icon={Clock}
          variant="warning"
          subtitle="Awaiting brand review"
        />
        <StatCard
          title="Total Earned"
          value={formatCurrency(totalEarned)}
          icon={DollarSign}
          variant="default"
          subtitle="From completed collabs"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active collaborations */}
        <div className="lg:col-span-2 space-y-4">
          <SectionCard
            title="Active Collaborations"
            description="Campaigns you're currently working on"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/creator/collaborations">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            }
          >
            {activeCollaborations.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No active collaborations"
                description="Apply to campaigns to start working with brands."
                action={{ label: "Browse Campaigns", href: "/creator/browse" }}
              />
            ) : (
              <div className="space-y-3">
                {activeCollaborations.map((collab) => {
                  const approvedSubs = collab.contentSubmissions.filter((s) => s.status === "APPROVED").length;
                  const totalSubs = collab.contentSubmissions.length;
                  return (
                    <Link key={collab.id} href={`/creator/collaborations/${collab.id}`} className="block">
                      <EntityCard
                        title={collab.application.campaign.title}
                        subtitle={`Brand: ${collab.application.campaign.brand.companyName}`}
                        meta={`${approvedSubs}/${totalSubs} submissions approved · ${formatCurrency(Number(collab.agreedRate))}`}
                        status={collab.status}
                        statusContext="collaboration"
                      />
                    </Link>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right sidebar: profile + notifications */}
        <div className="space-y-4">
          {/* Profile summary */}
          <SectionCard title="Your Profile">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-base font-semibold text-muted-foreground">
                  {getInitials(creator.displayName)}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{creator.displayName}</p>
                  {creator.niche && (
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                      {creator.niche}
                    </span>
                  )}
                </div>
              </div>

              {creator.bio && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {creator.bio}
                </p>
              )}

              <div className="space-y-1.5">
                {creator.instagramHandle && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AtSign className="h-3.5 w-3.5" />
                    @{creator.instagramHandle}
                  </div>
                )}
                {creator.country && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    {creator.country}
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{creator.portfolioItems.length} portfolio item{creator.portfolioItems.length !== 1 ? "s" : ""}</span>
              </div>

              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/creator/portfolio">Manage Portfolio</Link>
              </Button>
            </div>
          </SectionCard>

          {/* Recent notifications */}
          <SectionCard
            title="Recent Notifications"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/creator/notifications">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            }
            noPadding
          >
            {recentNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentNotifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    id={n.id}
                    message={n.message}
                    isRead={n.isRead}
                    createdAt={n.createdAt}
                    linkHref={n.linkHref}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
