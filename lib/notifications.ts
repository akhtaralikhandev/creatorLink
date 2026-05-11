import { db } from "./db";

type NotificationType =
  | "APPLICATION_RECEIVED"
  | "APPLICATION_ACCEPTED"
  | "APPLICATION_REJECTED"
  | "COLLABORATION_STARTED"
  | "SUBMISSION_RECEIVED"
  | "SUBMISSION_APPROVED"
  | "SUBMISSION_REJECTED"
  | "PAYMENT_PAID"
  | "COLLABORATION_COMPLETED";

interface CreateNotificationArgs {
  userId: string;
  type: NotificationType;
  message: string;
  linkHref?: string;
}

export async function createNotification(args: CreateNotificationArgs) {
  return db.notification.create({
    data: {
      userId: args.userId,
      type: args.type,
      message: args.message,
      linkHref: args.linkHref,
    },
  });
}
