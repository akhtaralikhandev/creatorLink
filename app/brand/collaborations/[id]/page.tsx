import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate, formatRelativeTime, getInitials, truncate } from "@/lib/utils";
import { ReviewSubmissionButton } from "./ReviewSubmissionButton";
import {
  ArrowLeft, AtSign, Globe, FileVideo, CheckCircle2, XCircle,
  Clock, DollarSign, Calendar, Briefcase
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BrandCollaborationDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const brand = await db.brand.findUnique({ where: { userId: session.user.id } });
  if (!brand) redirect("/onboarding");

  const collab = await db.collaboration.findFirst({
    where: {
      id,
      application: { campaign: { brandId: brand.id } },
    },
    include: {
      application: {
        include: {
          campaign: { select: { id: true, title: true, niche: true, budget: true } },
          creator: {
            select: {
              displayName: true,
              bio: true,
              niche: true,
              instagramHandle: true,
              tiktokHandle: true,
              country: true,
              profileImageUrl: true,
            },
          },
        },
      },
      contentSubmissions: {
        orderBy: { submittedAt: "desc" },
      },
      payment: true,
    },
  });

  if (!collab) notFound();

  const approvedCount = collab.contentSubmissions.filter((s) => s.status === "APPROVED").length;
  const totalCount = collab.contentSubmissions.length;
  const progressPercent = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  const creator = collab.application.creator;
  const campaign = collab.application.campaign;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Collaboration with ${creator.displayName}`}
        description={`For campaign: ${campaign.title}`}
        breadcrumb={
          <Link
            href="/brand/collaborations"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Collaborations
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: creator & campaign info */}
        <div className="space-y-4">
          {/* Creator card */}
          <SectionCard title="Creator">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-base font-semibold text-muted-foreground shrink-0">
                  {getInitials(creator.displayName)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{creator.displayName}</p>
                  {creator.niche && (
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                      {creator.niche}
                    </span>
                  )}
                </div>
              </div>

              {creator.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {truncate(creator.bio, 200)}
                </p>
              )}

              <div className="space-y-2">
                {creator.instagramHandle && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AtSign className="h-4 w-4 shrink-0" />
                    <span>@{creator.instagramHandle}</span>
                  </div>
                )}
                {creator.tiktokHandle && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-4 w-4 shrink-0 text-center text-xs font-bold">TT</span>
                    <span>@{creator.tiktokHandle}</span>
                  </div>
                )}
                {creator.country && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4 shrink-0" />
                    <span>{creator.country}</span>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Campaign card */}
          <SectionCard title="Campaign">
            <div className="space-y-2">
              <Link
                href={`/brand/campaigns/${campaign.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {campaign.title}
              </Link>
              {campaign.niche && (
                <p className="text-xs text-muted-foreground">Niche: {campaign.niche}</p>
              )}
              {campaign.budget && (
                <p className="text-xs text-muted-foreground">
                  Budget: {formatCurrency(Number(campaign.budget))}
                </p>
              )}
            </div>
          </SectionCard>

          {/* Application pitch */}
          {collab.application.pitch && (
            <SectionCard title="Creator's Pitch">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {collab.application.pitch}
              </p>
            </SectionCard>
          )}
        </div>

        {/* Right column: collaboration details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status & rate card */}
          <SectionCard title="Collaboration Overview">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> Status
                </p>
                <StatusBadge status={collab.status} context="collaboration" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Agreed Rate
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(Number(collab.agreedRate))}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Started
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(collab.startedAt)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Payment
                </p>
                {collab.payment ? (
                  <StatusBadge status={collab.payment.status} />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>

            {totalCount > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Submission progress</span>
                  <span>{approvedCount}/{totalCount} approved</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}

            {collab.notes && (
              <>
                <Separator className="my-4" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm text-foreground">{collab.notes}</p>
                </div>
              </>
            )}
          </SectionCard>

          {/* Submissions */}
          <SectionCard
            title="Content Submissions"
            description={`${totalCount} submission${totalCount !== 1 ? "s" : ""} · ${approvedCount} approved`}
          >
            {collab.contentSubmissions.length === 0 ? (
              <EmptyState
                icon={FileVideo}
                title="No submissions yet"
                description="The creator hasn't submitted any content yet."
              />
            ) : (
              <div className="space-y-4">
                {collab.contentSubmissions.map((submission, idx) => (
                  <div
                    key={submission.id}
                    className="rounded-lg border border-border p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">
                            Submission #{totalCount - idx}
                          </span>
                          <StatusBadge status={submission.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatRelativeTime(submission.submittedAt)}
                        </p>
                      </div>

                      {submission.status === "PENDING" && collab.status === "ACTIVE" && (
                        <ReviewSubmissionButton submissionId={submission.id} />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <a
                        href={submission.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <FileVideo className="h-4 w-4 shrink-0" />
                        <span className="truncate">{submission.videoUrl}</span>
                      </a>

                      {submission.caption && (
                        <p className="text-sm text-muted-foreground bg-muted/50 rounded px-3 py-2 leading-relaxed">
                          {submission.caption}
                        </p>
                      )}

                      {submission.feedback && (
                        <div className="text-sm bg-muted/50 rounded px-3 py-2">
                          <span className="font-medium text-muted-foreground">Feedback: </span>
                          <span className="text-foreground">{submission.feedback}</span>
                        </div>
                      )}
                    </div>

                    {/* Status icon */}
                    <div className="flex items-center gap-1.5 text-xs">
                      {submission.status === "APPROVED" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      ) : submission.status === "REJECTED" ? (
                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-warning" />
                      )}
                      <span className="text-muted-foreground">
                        {submission.status === "APPROVED"
                          ? "Approved — payment released"
                          : submission.status === "REJECTED"
                            ? "Rejected — revision requested"
                            : "Awaiting your review"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Payment timeline */}
          {collab.payment && (
            <SectionCard title="Payment">
              <div className="flex items-start gap-4">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    collab.payment.status === "PAID"
                      ? "bg-success-muted text-success"
                      : "bg-warning-muted text-warning"
                  }`}
                >
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(Number(collab.payment.amount))}
                  </p>
                  <StatusBadge status={collab.payment.status} className="mt-1" />
                  {collab.payment.paidAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Paid on {formatDate(collab.payment.paidAt)}
                    </p>
                  )}
                  {collab.payment.status === "PENDING" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Payment will be released when a submission is approved.
                    </p>
                  )}
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
