import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { NotificationItem } from "@/components/shared/NotificationItem";
import { MarkAllReadButton } from "./MarkAllReadButton";
import { Bell } from "lucide-react";

export default async function BrandNotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Notifications"
        description={
          unread.length > 0
            ? `${unread.length} unread notification${unread.length !== 1 ? "s" : ""}`
            : "You're all caught up!"
        }
        action={unread.length > 0 ? <MarkAllReadButton /> : undefined}
      />

      {notifications.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="You'll receive notifications when creators apply, submit content, and more."
          />
        </SectionCard>
      ) : (
        <div className="space-y-4">
          {unread.length > 0 && (
            <SectionCard title={`Unread (${unread.length})`} noPadding>
              <div className="divide-y divide-border overflow-hidden rounded-b-lg">
                {unread.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    id={notification.id}
                    message={notification.message}
                    isRead={notification.isRead}
                    createdAt={notification.createdAt}
                    linkHref={notification.linkHref}
                  />
                ))}
              </div>
            </SectionCard>
          )}

          {read.length > 0 && (
            <SectionCard title={`Read (${read.length})`} noPadding>
              <div className="divide-y divide-border overflow-hidden rounded-b-lg">
                {read.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    id={notification.id}
                    message={notification.message}
                    isRead={notification.isRead}
                    createdAt={notification.createdAt}
                    linkHref={notification.linkHref}
                  />
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}
