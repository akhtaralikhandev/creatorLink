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
import { formatDate, formatCurrency, truncate } from "@/lib/utils";
import { FileText, Building2, Calendar, DollarSign, Megaphone } from "lucide-react";
import type { ApplicationStatus } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function CreatorApplicationsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const statusFilter = params.status as ApplicationStatus | undefined;

  const creator = await db.creator.findUnique({ where: { userId: session.user.id } });
  if (!creator) redirect("/onboarding");

  const applications = await db.application.findMany({
    where: {
      creatorId: creator.id,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { appliedAt: "desc" },
    include: {
      campaign: {
        include: {
          brand: { select: { companyName: true, industry: true } },
        },
      },
      collaboration: { select: { id: true } },
    },
  });

  const [allCount, pendingCount, acceptedCount, rejectedCount] = await Promise.all([
    db.application.count({ where: { creatorId: creator.id } }),
    db.application.count({ where: { creatorId: creator.id, status: "PENDING" } }),
    db.application.count({ where: { creatorId: creator.id, status: "ACCEPTED" } }),
    db.application.count({ where: { creatorId: creator.id, status: "REJECTED" } }),
  ]);

  const STATUS_TABS = [
    { label: "All", value: "", count: allCount },
    { label: "Pending", value: "PENDING", count: pendingCount },
    { label: "Accepted", value: "ACCEPTED", count: acceptedCount },
    { label: "Rejected", value: "REJECTED", count: rejectedCount },
  ];

  const buildHref = (status: string) => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    return `/creator/applications${p.toString() ? `?${p.toString()}` : ""}`;
  };

  // Group by status for display when no filter
  const grouped = statusFilter
    ? { [statusFilter]: applications }
    : {
        PENDING: applications.filter((a) => a.status === "PENDING"),
        ACCEPTED: applications.filter((a) => a.status === "ACCEPTED"),
        REJECTED: applications.filter((a) => a.status === "REJECTED"),
      };

  const sectionLabels: Record<string, string> = {
    PENDING: "Pending Review",
    ACCEPTED: "Accepted",
    REJECTED: "Not Selected",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Applications"
        description="Track all your campaign applications and their status."
        action={
          <Button asChild>
            <Link href="/creator/browse">
              <Megaphone className="h-4 w-4 mr-2" />
              Browse More
            </Link>
          </Button>
        }
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

      {applications.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={FileText}
            title="No applications yet"
            description={
              statusFilter
                ? `You have no ${statusFilter.toLowerCase()} applications.`
                : "Start applying to campaigns to see them here."
            }
            action={
              !statusFilter
                ? { label: "Browse Campaigns", href: "/creator/browse" }
                : undefined
            }
          />
        </SectionCard>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([status, apps]) => {
            if (apps.length === 0) return null;
            return (
              <SectionCard
                key={status}
                title={sectionLabels[status] ?? status}
                description={`${apps.length} application${apps.length !== 1 ? "s" : ""}`}
                noPadding
              >
                <div className="divide-y divide-border">
                  {apps.map((application) => (
                    <div key={application.id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Campaign title */}
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-foreground">
                                {application.campaign.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Building2 className="h-3 w-3" />
                                  {application.campaign.brand.companyName}
                                </span>
                                {application.campaign.brand.industry && (
                                  <span className="text-xs text-muted-foreground">
                                    · {application.campaign.brand.industry}
                                  </span>
                                )}
                              </div>
                            </div>
                            <StatusBadge status={application.status} />
                          </div>

                          {/* Meta info */}
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Applied {formatDate(application.appliedAt)}
                            </span>
                            {application.campaign.niche && (
                              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                                {application.campaign.niche}
                              </span>
                            )}
                            {application.campaign.budget && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(Number(application.campaign.budget))}
                              </span>
                            )}
                          </div>

                          {/* Pitch preview */}
                          {application.pitch && (
                            <p className="text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2 leading-relaxed">
                              {truncate(application.pitch, 180)}
                            </p>
                          )}
                        </div>

                        {/* Action */}
                        <div className="shrink-0">
                          {application.collaboration ? (
                            <Button variant="default" size="sm" asChild>
                              <Link href={`/creator/collaborations/${application.collaboration.id}`}>
                                View Collaboration
                              </Link>
                            </Button>
                          ) : application.status === "ACCEPTED" ? (
                            <Button variant="outline" size="sm" disabled>
                              Setting up...
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
