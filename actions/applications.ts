"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { applySchema, reviewApplicationSchema } from "@/lib/validations";
import { createNotification } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

// Creator applies to a campaign
export async function applyToCampaign(data: unknown) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CREATOR") {
    return { error: "Unauthorized" };
  }

  const parsed = applySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const creator = await db.creator.findUnique({ where: { userId: session.user.id } });
  if (!creator) return { error: "Creator profile not found" };

  const campaign = await db.campaign.findUnique({
    where: { id: parsed.data.campaignId },
    include: { brand: { include: { user: true } } },
  });
  if (!campaign || campaign.status !== "ACTIVE") return { error: "Campaign not available" };

  const existing = await db.application.findUnique({
    where: { campaignId_creatorId: { campaignId: campaign.id, creatorId: creator.id } },
  });
  if (existing) return { error: "You have already applied to this campaign" };

  const application = await db.application.create({
    data: {
      campaignId: campaign.id,
      creatorId: creator.id,
      pitch: parsed.data.pitch || null,
    },
  });

  // Notify brand
  await createNotification({
    userId: campaign.brand.userId,
    type: "APPLICATION_RECEIVED",
    message: `${creator.displayName} applied to your campaign "${campaign.title}"`,
    linkHref: `/brand/applications?campaign=${campaign.id}`,
  });

  revalidatePath("/creator/applications");
  revalidatePath("/creator/browse");
  return { success: true, id: application.id };
}

// Brand reviews an application
export async function reviewApplication(data: unknown) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "BRAND") {
    return { error: "Unauthorized" };
  }

  const parsed = reviewApplicationSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const brand = await db.brand.findUnique({ where: { userId: session.user.id } });
  if (!brand) return { error: "Brand not found" };

  const application = await db.application.findUnique({
    where: { id: parsed.data.applicationId },
    include: {
      campaign: true,
      creator: { include: { user: true } },
    },
  });

  if (!application || application.campaign.brandId !== brand.id) {
    return { error: "Application not found" };
  }

  if (application.status !== "PENDING") {
    return { error: "Application already reviewed" };
  }

  await db.application.update({
    where: { id: application.id },
    data: { status: parsed.data.status },
  });

  // If accepted, create collaboration + payment
  if (parsed.data.status === "ACCEPTED") {
    const agreedRate = parsed.data.agreedRate ?? Number(application.campaign.budget ?? 0);

    const collab = await db.collaboration.create({
      data: {
        applicationId: application.id,
        agreedRate,
      },
    });

    await db.payment.create({
      data: {
        collaborationId: collab.id,
        amount: agreedRate,
      },
    });

    await createNotification({
      userId: application.creator.userId,
      type: "APPLICATION_ACCEPTED",
      message: `Your application to "${application.campaign.title}" was accepted! A collaboration has been created.`,
      linkHref: `/creator/collaborations/${collab.id}`,
    });
  } else {
    await createNotification({
      userId: application.creator.userId,
      type: "APPLICATION_REJECTED",
      message: `Your application to "${application.campaign.title}" was not selected this time.`,
      linkHref: `/creator/applications`,
    });
  }

  revalidatePath("/brand/applications");
  return { success: true };
}
