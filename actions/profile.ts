"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { brandProfileSchema, creatorProfileSchema, portfolioItemSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function updateBrandProfile(data: unknown) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "BRAND") return { error: "Unauthorized" };

  const parsed = brandProfileSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  await db.brand.update({
    where: { userId: session.user.id },
    data: {
      companyName: parsed.data.companyName,
      industry: parsed.data.industry || null,
      website: parsed.data.website || null,
      bio: parsed.data.bio || null,
      logoUrl: parsed.data.logoUrl || null,
    },
  });

  revalidatePath("/brand/dashboard");
  return { success: true };
}

export async function updateCreatorProfile(data: unknown) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CREATOR") return { error: "Unauthorized" };

  const parsed = creatorProfileSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  await db.creator.update({
    where: { userId: session.user.id },
    data: {
      displayName: parsed.data.displayName,
      bio: parsed.data.bio || null,
      niche: parsed.data.niche || null,
      instagramHandle: parsed.data.instagramHandle || null,
      tiktokHandle: parsed.data.tiktokHandle || null,
      country: parsed.data.country || null,
      profileImageUrl: parsed.data.profileImageUrl || null,
    },
  });

  revalidatePath("/creator/dashboard");
  return { success: true };
}

export async function addPortfolioItem(data: unknown) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CREATOR") return { error: "Unauthorized" };

  const parsed = portfolioItemSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const creator = await db.creator.findUnique({ where: { userId: session.user.id } });
  if (!creator) return { error: "Creator not found" };

  await db.portfolioItem.create({
    data: {
      creatorId: creator.id,
      mediaUrl: parsed.data.mediaUrl,
      mediaType: parsed.data.mediaType,
      caption: parsed.data.caption || null,
    },
  });

  revalidatePath("/creator/portfolio");
  return { success: true };
}

export async function deletePortfolioItem(itemId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CREATOR") return { error: "Unauthorized" };

  const creator = await db.creator.findUnique({ where: { userId: session.user.id } });
  if (!creator) return { error: "Creator not found" };

  const item = await db.portfolioItem.findFirst({
    where: { id: itemId, creatorId: creator.id },
  });
  if (!item) return { error: "Item not found" };

  await db.portfolioItem.delete({ where: { id: itemId } });
  revalidatePath("/creator/portfolio");
  return { success: true };
}
