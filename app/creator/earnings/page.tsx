import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, CheckCircle2, Clock, TrendingUp } from "lucide-react";

export default async function CreatorEarningsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const creator = await db.creator.findUnique({ where: { userId: session.user.id } });
  if (!creator) redirect("/onboarding");

  // All payments for this creator's collaborations
  const payments = await db.payment.findMany({
    where: {
      collaboration: { application: { creatorId: creator.id } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      collaboration: {
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
        },
      },
    },
  });

  const paidPayments = payments.filter((p) => p.status === "PAID");
  const pendingPayments = payments.filter((p) => p.status === "PENDING");

  const totalEarned = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCollabs = payments.length;

  // Monthly breakdown (last 6 months)
  const monthlyMap: Record<string, number> = {};
  for (const p of paidPayments) {
    if (p.paidAt) {
      const key = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(
        new Date(p.paidAt)
      );
      monthlyMap[key] = (monthlyMap[key] ?? 0) + Number(p.amount);
    }
  }
  const monthlyEntries = Object.entries(monthlyMap).slice(0, 6);
  const maxMonthlyAmount = Math.max(...monthlyEntries.map(([, v]) => v), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earnings"
        description="Track your payment history and income from brand collaborations."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Earned"
          value={formatCurrency(totalEarned)}
          icon={DollarSign}
          variant="success"
          subtitle="All completed payments"
        />
        <StatCard
          title="Pending"
          value={formatCurrency(pendingAmount)}
          icon={Clock}
          variant="warning"
          subtitle="Awaiting approval"
        />
        <StatCard
          title="Collaborations"
          value={totalCollabs}
          icon={TrendingUp}
          variant="primary"
          subtitle="Total with payments"
        />
        <StatCard
          title="Avg. per Collab"
          value={totalCollabs > 0 ? formatCurrency(totalEarned / Math.max(paidPayments.length, 1)) : "$0"}
          icon={DollarSign}
          variant="default"
          subtitle="From completed work"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly breakdown */}
        {monthlyEntries.length > 0 && (
          <SectionCard
            title="Monthly Earnings"
            description="Paid amounts by month"
          >
            <div className="space-y-3">
              {monthlyEntries.map(([month, amount]) => (
                <div key={month} className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{month}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(amount)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(amount / maxMonthlyAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Payment history table */}
        <div className={monthlyEntries.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
          <SectionCard
            title="Payment History"
            description="All payments from your brand collaborations"
            noPadding
          >
            {payments.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="No payments yet"
                description="Complete collaborations with brands to earn money."
                action={{ label: "Browse Campaigns", href: "/creator/browse" }}
              />
            ) : (
              <div className="divide-y divide-border">
                {payments.map((payment) => {
                  const campaign = payment.collaboration.application.campaign;
                  return (
                    <div key={payment.id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                              payment.status === "PAID"
                                ? "bg-success-muted"
                                : "bg-warning-muted"
                            }`}
                          >
                            {payment.status === "PAID" ? (
                              <CheckCircle2
                                className={`h-4 w-4 ${
                                  payment.status === "PAID" ? "text-success" : "text-warning"
                                }`}
                              />
                            ) : (
                              <Clock className="h-4 w-4 text-warning" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/creator/collaborations/${payment.collaborationId}`}
                              className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                            >
                              {campaign.title}
                            </Link>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {campaign.brand.companyName}
                            </p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <StatusBadge status={payment.status} />
                              {payment.paidAt && (
                                <span className="text-xs text-muted-foreground">
                                  Paid {formatDate(payment.paidAt)}
                                </span>
                              )}
                              {payment.status === "PENDING" && (
                                <span className="text-xs text-warning">
                                  Waiting for approval
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p
                            className={`text-base font-bold ${
                              payment.status === "PAID" ? "text-success" : "text-warning"
                            }`}
                          >
                            {formatCurrency(Number(payment.amount))}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(payment.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Pending payments note */}
      {pendingPayments.length > 0 && (
        <SectionCard>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {pendingPayments.length} pending payment{pendingPayments.length !== 1 ? "s" : ""} totaling {formatCurrency(pendingAmount)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Submit and get your content approved by the brand to receive payment. Payments are released automatically when content is approved.
              </p>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
