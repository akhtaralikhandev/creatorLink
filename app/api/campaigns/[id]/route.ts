import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "BRAND") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const brand = await db.brand.findUnique({ where: { userId: session.user.id } });
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const campaign = await db.campaign.findFirst({
    where: { id, brandId: brand.id },
    select: {
      id: true,
      title: true,
      description: true,
      budget: true,
      niche: true,
      status: true,
      coverImage: true,
    },
  });

  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...campaign,
    budget: campaign.budget ? Number(campaign.budget) : null,
  });
}
