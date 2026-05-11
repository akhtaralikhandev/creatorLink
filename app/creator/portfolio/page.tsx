import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { AddPortfolioItemDialog } from "./AddPortfolioItemDialog";
import { DeletePortfolioItemButton } from "./DeletePortfolioItemButton";
import { formatDate } from "@/lib/utils";
import { ImageIcon, Video, ExternalLink, Plus } from "lucide-react";
import { PortfolioImage } from "./PortfolioImage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function CreatorPortfolioPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const creator = await db.creator.findUnique({ where: { userId: session.user.id } });
  if (!creator) redirect("/onboarding");

  const portfolioItems = await db.portfolioItem.findMany({
    where: { creatorId: creator.id },
    orderBy: { uploadedAt: "desc" },
  });

  const imageItems = portfolioItems.filter((i) => i.mediaType === "IMAGE");
  const videoItems = portfolioItems.filter((i) => i.mediaType === "VIDEO");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio"
        description={`Showcase your best work. ${portfolioItems.length} item${portfolioItems.length !== 1 ? "s" : ""} in your portfolio.`}
        action={<AddPortfolioItemDialog />}
      />

      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{imageItems.length} image{imageItems.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{videoItems.length} video{videoItems.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {portfolioItems.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={ImageIcon}
            title="Your portfolio is empty"
            description="Add images and videos to showcase your work to potential brand partners."
            action={{ label: "Add First Item", href: "#" }}
          />
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {portfolioItems.map((item) => (
            <div
              key={item.id}
              className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              {/* Media preview */}
              <div className="aspect-video bg-muted relative overflow-hidden">
                {item.mediaType === "IMAGE" ? (
                  <PortfolioImage
                    src={item.mediaUrl}
                    alt={item.caption ?? "Portfolio item"}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="text-xs">
                    {item.mediaType === "IMAGE" ? (
                      <ImageIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <Video className="h-3 w-3 mr-1" />
                    )}
                    {item.mediaType}
                  </Badge>
                </div>
              </div>

              {/* Item details */}
              <div className="p-3 space-y-2">
                {item.caption && (
                  <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                    {item.caption}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Added {formatDate(item.uploadedAt)}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={item.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </a>
                  <DeletePortfolioItemButton itemId={item.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
