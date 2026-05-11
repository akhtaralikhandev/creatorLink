"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { campaignSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

async function requireBrand() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "BRAND") {
    throw new Error("Unauthorized");
  }
  const brand = await db.brand.findUnique({ where: { userId: session.user.id } });
  if (!brand) throw new Error("Brand profile not found");
  return { session, brand };
}

export async function createCampaign(data: unknown) {
  const { brand } = await requireBrand();
  const parsed = campaignSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const { budget, coverImage, website: _w, ...rest } = parsed.data as any;

  const campaign = await db.campaign.create({
    data: {
      ...rest,
      budget: budget ?? null,
      coverImage: coverImage || null,
      brandId: brand.id,
    },
  });

  revalidatePath("/brand/campaigns");
  return { success: true, id: campaign.id };
}

export async function updateCampaign(campaignId: string, data: unknown) {
  const { brand } = await requireBrand();
  const parsed = campaignSchema.partial().safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  // Ensure this campaign belongs to this brand
  const existing = await db.campaign.findFirst({
    where: { id: campaignId, brandId: brand.id },
  });
  if (!existing) return { error: "Campaign not found" };

  const { budget, coverImage, ...rest } = parsed.data as any;

  await db.campaign.update({
    where: { id: campaignId },
    data: {
      ...rest,
      ...(budget !== undefined ? { budget } : {}),
      ...(coverImage !== undefined ? { coverImage: coverImage || null } : {}),
    },
  });

  revalidatePath("/brand/campaigns");
  revalidatePath(`/brand/campaigns/${campaignId}`);
  return { success: true };
}

export async function deleteCampaign(campaignId: string) {
  const { brand } = await requireBrand();

  const existing = await db.campaign.findFirst({
    where: { id: campaignId, brandId: brand.id },
  });
  if (!existing) return { error: "Campaign not found" };

  await db.campaign.delete({ where: { id: campaignId } });
  revalidatePath("/brand/campaigns");
  return { success: true };
}
