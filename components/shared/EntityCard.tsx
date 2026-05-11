import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { UserAvatar } from "./UserAvatar";

interface EntityCardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  status?: string;
  statusContext?: "campaign" | "collaboration";
  image?: string | null;
  initials?: string;
  tags?: string[];
  action?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function EntityCard({
  title, subtitle, meta, status, statusContext, image, initials, tags, action, onClick, className, children,
}: EntityCardProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-200",
        onClick && "cursor-pointer hover:border-primary/40 hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {(image !== undefined || initials) && (
            <UserAvatar name={initials ?? title} image={image} size="md" className="shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
              {status && <StatusBadge status={status} context={statusContext} />}
            </div>
            {subtitle && <p className="text-sm text-muted-foreground line-clamp-2">{subtitle}</p>}
            {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {children}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
