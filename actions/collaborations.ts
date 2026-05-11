"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { submitContentSchema, reviewSubmissionSchema } from "@/lib/validations";
import { createNotification } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

// Creator submits content for a collaboration
export async function submitContent(data: unknown) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CREATOR") {
    return { error: "Unauthorized" };
  }

  const parsed = submitContentSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const creator = await db.creator.findUnique({ where: { userId: session.user.id } });
  if (!creator) return { error: "Creator not found" };

  const collab = await db.collaboration.findUnique({
    where: { id: parsed.data.collaborationId },
    include: {
      application: {
        include: {
          campaign: { include: { brand: { include: { user: true } } } },
          creator: true,
        },
      },
    },
  });

  if (!collab || collab.application.creatorId !== creator.id) {
    return { error: "Collaboration not found" };
  }

  if (collab.status !== "ACTIVE") {
    return { error: "Collaboration is not active" };
  }

  const submission = await db.contentSubmission.create({
    data: {
      collaborationId: collab.id,
      videoUrl: parsed.data.videoUrl,
      caption: parsed.data.caption || null,
    },
  });

  // Notify brand
  await createNotification({
    userId: collab.application.campaign.brand.userId,
    type: "SUBMISSION_RECEIVED",
    message: `${creator.displayName} submitted content for "${collab.application.campaign.title}"`,
    linkHref: `/brand/collaborations/${collab.id}`,
  });

  revalidatePath(`/creator/collaborations/${collab.id}`);
  return { success: true, id: submission.id };
}

// Brand reviews a content submission
export async function reviewSubmission(data: unknown) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "BRAND") {
    return { error: "Unauthorized" };
  }

  const parsed = reviewSubmissionSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const brand = await db.brand.findUnique({ where: { userId: session.user.id } });
  if (!brand) return { error: "Brand not found" };

  const submission = await db.contentSubmission.findUnique({
    where: { id: parsed.data.submissionId },
    include: {
      collaboration: {
        include: {
          application: {
            include: {
              campaign: true,
              creator: { include: { user: true } },
            },
          },
        },
      },
    },
  });

  if (!submission || submission.collaboration.application.campaign.brandId !== brand.id) {
    return { error: "Submission not found" };
  }

  await db.contentSubmission.update({
    where: { id: submission.id },
    data: {
      status: parsed.data.status,
      feedback: parsed.data.feedback || null,
    },
  });

  const creatorUserId = submission.collaboration.application.creator.userId;
  const campaignTitle = submission.collaboration.application.campaign.title;
  const collabId = submission.collaboration.id;

  if (parsed.data.status === "APPROVED") {
    // Mark collaboration completed and pay
    await db.collaboration.update({
      where: { id: collabId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    await db.payment.update({
      where: { collaborationId: collabId },
      data: { status: "PAID", paidAt: new Date() },
    });

    await createNotification({
      userId: creatorUserId,
      type: "SUBMISSION_APPROVED",
      message: `Your content for "${campaignTitle}" was approved! Payment has been released.`,
      linkHref: `/creator/collaborations/${collabId}`,
    });
  } else {
    await createNotification({
      userId: creatorUserId,
      type: "SUBMISSION_REJECTED",
      message: `Your content submission for "${campaignTitle}" needs revisions.`,
      linkHref: `/creator/collaborations/${collabId}`,
    });
  }

  revalidatePath(`/brand/collaborations/${collabId}`);
  return { success: true };
}
