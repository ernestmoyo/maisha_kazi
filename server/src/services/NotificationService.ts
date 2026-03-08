import prisma from "../utils/prisma.js";
import type { NotificationType } from "../generated/prisma/client.js";

export class NotificationService {
  static async createNotification(
    userId: string,
    message: string,
    type: NotificationType = "GENERAL"
  ) {
    return prisma.notification.create({
      data: {
        userId,
        message,
        type,
      },
    });
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
