import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  className?: string;
}

const VARIANT_MAP = {
  default:     { icon: "bg-muted text-muted-foreground", trend: "" },
  primary:     { icon: "bg-primary/10 text-primary", trend: "text-primary" },
  success:     { icon: "bg-success-muted text-success", trend: "text-success" },
  warning:     { icon: "bg-warning-muted text-warning", trend: "text-warning" },
  destructive: { icon: "bg-destructive-muted text-destructive", trend: "text-destructive" },
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = "default", className }: StatCardProps) {
  const styles = VARIANT_MAP[variant];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && (
              <p className={cn("text-xs font-medium mt-1", styles.trend)}>
                {trend.value > 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          {Icon && (
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ml-4", styles.icon)}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
