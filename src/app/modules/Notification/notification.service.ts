import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const NotificationService = {
  getAll: async () => {
    return prisma.notification.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  markAsRead: async (id: string) => {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  },

  delete: async (id: string) => {
    return prisma.notification.delete({
      where: { id },
    });
  },
};
