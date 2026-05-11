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
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Briefcase, CheckCircle2, Clock, DollarSign } from "lucide-react";

type CollaborationStatus = "ACTIVE" | "COMPLETED";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function CreatorCollaborationsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const statusFilter = params.status as CollaborationStatus | undefined;

  const creator = await db.creator.findUnique({ where: { userId: session.user.id } });
  if (!creator) redirect("/onboarding");

  const collaborations = await db.collaboration.findMany({
    where: {
      application: { creatorId: creator.id },
      ...(statusFilter ? { status: statusFilter } : {}),
    },
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
      payment: { select: { status: true, amount: true, paidAt: true } },
    },
  });

  const [allCount, activeCount, completedCount] = await Promise.all([
    db.collaboration.count({ where: { application: { creatorId: creator.id } } }),
    db.collaboration.count({ where: { application: { creatorId: creator.id }, status: "ACTIVE" } }),
    db.collaboration.count({ where: { application: { creatorId: creator.id }, status: "COMPLETED" } }),
  ]);

  const STATUS_TABS = [
    { label: "All", value: "", count: allCount },
    { label: "Active", value: "ACTIVE", count: activeCount },
    { label: "Completed", value: "COMPLETED", count: completedCount },
  ];

  const buildHref = (status: string) => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    return `/creator/collaborations${p.toString() ? `?${p.toString()}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collaborations"
        description="Track your brand partnerships from start to payment."
      />

      {/* Status tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => {
          const isActive = (statusFilter ?? "") === tab.value;
          return (
            <Link key={tab.value} href={buildHref(tab.value)}>
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

      <SectionCard noPadding>
        {collaborations.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No collaborations found"
            description={
              statusFilter
                ? `No ${statusFilter.toLowerCase()} collaborations found.`
                : "When brands accept your applications, collaborations will appear here."
            }
            action={
              !statusFilter ? { label: "Browse Campaigns", href: "/creator/browse" } : undefined
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {collaborations.map((collab) => {
              const approvedSubs = collab.contentSubmissions.filter((s) => s.status === "APPROVED").length;
              const totalSubs = collab.contentSubmissions.length;
              const progressPercent = totalSubs > 0 ? Math.round((approvedSubs / totalSubs) * 100) : 0;
              const pendingSubs = collab.contentSubmissions.filter((s) => s.status === "PENDING").length;

              return (
                <div key={collab.id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground">
                          {collab.application.campaign.title}
                        </h3>
                        <StatusBadge status={collab.status} context="collaboration" />
                        {collab.payment && (
                          <StatusBadge status={collab.payment.status} />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {collab.application.campaign.brand.companyName}
                      </p>
                    </div>

                    <Button variant="outline" size="sm" asChild className="shrink-0">
                      <Link href={`/creator/collaborations/${collab.id}`}>View</Link>
                    </Button>
                  </div>

                  {/* Key info grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> Rate
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(Number(collab.agreedRate))}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Started
                      </p>
                      <p className="text-xs text-foreground">{formatDate(collab.startedAt)}</p>
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Submissions
                      </p>
                      <p className="text-xs text-foreground">
                        {approvedSubs}/{totalSubs} approved
                        {pendingSubs > 0 && (
                          <span className="text-warning ml-1">({pendingSubs} pending)</span>
                        )}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Payment</p>
                      {collab.payment ? (
                        <div>
                          <StatusBadge status={collab.payment.status} />
                          {collab.payment.paidAt && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDate(collab.payment.paidAt)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {totalSubs > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Submission progress</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-1.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
