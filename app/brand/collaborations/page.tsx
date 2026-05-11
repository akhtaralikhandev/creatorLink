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
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { Briefcase, CheckCircle2, Clock } from "lucide-react";

type CollaborationStatus = "ACTIVE" | "COMPLETED";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function BrandCollaborationsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const statusFilter = params.status as CollaborationStatus | undefined;

  const brand = await db.brand.findUnique({ where: { userId: session.user.id } });
  if (!brand) redirect("/onboarding");

  const collaborations = await db.collaboration.findMany({
    where: {
      application: { campaign: { brandId: brand.id } },
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { startedAt: "desc" },
    include: {
      application: {
        include: {
          campaign: { select: { id: true, title: true } },
          creator: { select: { displayName: true, niche: true, profileImageUrl: true } },
        },
      },
      contentSubmissions: { select: { id: true, status: true } },
      payment: { select: { status: true, amount: true } },
    },
  });

  const allCount = await db.collaboration.count({
    where: { application: { campaign: { brandId: brand.id } } },
  });
  const activeCount = await db.collaboration.count({
    where: { application: { campaign: { brandId: brand.id } }, status: "ACTIVE" },
  });
  const completedCount = await db.collaboration.count({
    where: { application: { campaign: { brandId: brand.id } }, status: "COMPLETED" },
  });

  const STATUS_TABS = [
    { label: "All", value: "", count: allCount },
    { label: "Active", value: "ACTIVE", count: activeCount },
    { label: "Completed", value: "COMPLETED", count: completedCount },
  ];

  const buildHref = (status: string) => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    return `/brand/collaborations${p.toString() ? `?${p.toString()}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collaborations"
        description="Monitor active and completed creator collaborations."
      />

      {/* Status filter */}
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
                : "Collaborations are created when you accept a creator's application."
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {collaborations.map((collab) => {
              const approvedSubmissions = collab.contentSubmissions.filter(
                (s) => s.status === "APPROVED"
              ).length;
              const totalSubmissions = collab.contentSubmissions.length;

              return (
                <div key={collab.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
                        {getInitials(collab.application.creator.displayName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">
                            {collab.application.creator.displayName}
                          </span>
                          <StatusBadge status={collab.status} context="collaboration" />
                          {collab.payment && (
                            <StatusBadge status={collab.payment.status} />
                          )}
                        </div>

                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Campaign:{" "}
                          <Link
                            href={`/brand/campaigns/${collab.application.campaign.id}`}
                            className="text-primary hover:underline"
                          >
                            {collab.application.campaign.title}
                          </Link>
                        </div>

                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="font-medium text-foreground">
                              {formatCurrency(Number(collab.agreedRate))}
                            </span>
                            agreed rate
                          </span>

                          {collab.application.creator.niche && (
                            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                              {collab.application.creator.niche}
                            </span>
                          )}

                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            {approvedSubmissions > 0 ? (
                              <CheckCircle2 className="h-3 w-3 text-success" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {approvedSubmissions}/{totalSubmissions} submissions approved
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">
                          Started {formatDate(collab.startedAt)}
                          {collab.completedAt && ` · Completed ${formatDate(collab.completedAt)}`}
                        </p>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" asChild className="shrink-0">
                      <Link href={`/brand/collaborations/${collab.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
