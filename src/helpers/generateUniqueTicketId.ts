import prisma from "../shared/prisma";

export const generateUniqueTicketId = async (length: number): Promise<string> => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ticketId = "";

  for (let i = 0; i < length; i++) {
    ticketId += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const fullTicketId = "TKT-" + ticketId;

  // DB তে exists কিনা চেক করা
  const isExist = await prisma.addParcel.findUnique({
    where: { trackingId: fullTicketId },
  });

  if (isExist) {
    // Recursively নতুন ID generate করো
    return generateUniqueTicketId(length);
  }

  return fullTicketId;
};