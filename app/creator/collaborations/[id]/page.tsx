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
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { SubmitContentForm } from "./SubmitContentForm";
import {
  ArrowLeft, Briefcase, DollarSign, Calendar, FileVideo,
  CheckCircle2, XCircle, Clock, Building2, ExternalLink
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CreatorCollaborationDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const creator = await db.creator.findUnique({ where: { userId: session.user.id } });
  if (!creator) redirect("/onboarding");

  const collab = await db.collaboration.findFirst({
    where: {
      id,
      application: { creatorId: creator.id },
    },
    include: {
      application: {
        include: {
          campaign: {
            include: {
              brand: { select: { companyName: true, industry: true, website: true } },
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
  const isActive = collab.status === "ACTIVE";

  const campaign = collab.application.campaign;
  const brand = campaign.brand;

  return (
    <div className="space-y-6">
      <PageHeader
        title={campaign.title}
        description={`Collaboration with ${brand.companyName}`}
        breadcrumb={
          <Link
            href="/creator/collaborations"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Collaborations
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: campaign + overview */}
        <div className="space-y-4">
          {/* Campaign info */}
          <SectionCard title="Campaign">
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{brand.companyName}</span>
                </div>
                {brand.industry && (
                  <p className="text-xs text-muted-foreground mt-0.5 ml-6">{brand.industry}</p>
                )}
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline mt-0.5 ml-6"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {brand.website}
                  </a>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Campaign</p>
                <p className="text-sm font-semibold text-foreground">{campaign.title}</p>
                {campaign.niche && (
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full mt-1 inline-block">
                    {campaign.niche}
                  </span>
                )}
              </div>

              {campaign.description && (
                <>
                  <Separator />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {campaign.description}
                  </p>
                </>
              )}
            </div>
          </SectionCard>

          {/* Collaboration overview */}
          <SectionCard title="Collaboration Details">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> Status
                </span>
                <StatusBadge status={collab.status} context="collaboration" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Agreed Rate
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(Number(collab.agreedRate))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Started
                </span>
                <span className="text-xs text-foreground">{formatDate(collab.startedAt)}</span>
              </div>
              {collab.completedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Completed
                  </span>
                  <span className="text-xs text-foreground">{formatDate(collab.completedAt)}</span>
                </div>
              )}

              {collab.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Notes from Brand</p>
                    <p className="text-sm text-foreground">{collab.notes}</p>
                  </div>
                </>
              )}
            </div>
          </SectionCard>

          {/* Your pitch */}
          {collab.application.pitch && (
            <SectionCard title="Your Pitch">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {collab.application.pitch}
              </p>
            </SectionCard>
          )}
        </div>

        {/* Right: submissions + payment */}
        <div className="lg:col-span-2 space-y-4">
          {/* Submit content section */}
          {isActive && (
            <SectionCard
              title="Submit Content"
              description="Share your content URL for brand review."
            >
              <SubmitContentForm collaborationId={collab.id} />
            </SectionCard>
          )}

          {/* Submissions history */}
          <SectionCard
            title="Submissions History"
            description={`${totalCount} submission${totalCount !== 1 ? "s" : ""} · ${approvedCount} approved`}
          >
            {totalCount > 0 && (
              <div className="mb-4 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Overall progress</span>
                  <span>{approvedCount}/{totalCount} approved</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}

            {collab.contentSubmissions.length === 0 ? (
              <EmptyState
                icon={FileVideo}
                title="No submissions yet"
                description={
                  isActive
                    ? "Use the form above to submit your first content."
                    : "No content was submitted for this collaboration."
                }
              />
            ) : (
              <div className="space-y-3">
                {collab.contentSubmissions.map((submission, idx) => (
                  <div
                    key={submission.id}
                    className="rounded-lg border border-border p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            Submission #{totalCount - idx}
                          </span>
                          <StatusBadge status={submission.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatRelativeTime(submission.submittedAt)}
                        </p>
                      </div>
                      {submission.status === "APPROVED" && (
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      )}
                      {submission.status === "REJECTED" && (
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      {submission.status === "PENDING" && (
                        <Clock className="h-4 w-4 text-warning shrink-0" />
                      )}
                    </div>

                    <a
                      href={submission.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileVideo className="h-4 w-4 shrink-0" />
                      <span className="truncate">{submission.videoUrl}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>

                    {submission.caption && (
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded px-3 py-2 leading-relaxed">
                        {submission.caption}
                      </p>
                    )}

                    {submission.feedback && (
                      <div className="rounded-md bg-muted px-3 py-2.5">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Brand Feedback
                        </p>
                        <p className="text-sm text-foreground">{submission.feedback}</p>
                      </div>
                    )}

                    {submission.status === "PENDING" && (
                      <p className="text-xs text-warning">
                        Awaiting brand review...
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Payment */}
          {collab.payment && (
            <SectionCard title="Payment Status">
              <div className="flex items-start gap-4">
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${
                    collab.payment.status === "PAID"
                      ? "bg-success-muted text-success"
                      : "bg-warning-muted text-warning"
                  }`}
                >
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(Number(collab.payment.amount))}
                  </p>
                  <StatusBadge status={collab.payment.status} />

                  {collab.payment.status === "PAID" && collab.payment.paidAt ? (
                    <p className="text-sm text-success">
                      Payment received on {formatDate(collab.payment.paidAt)}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Payment will be released once the brand approves your content submission.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Submit great content to trigger payment</span>
                      </div>
                    </div>
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
