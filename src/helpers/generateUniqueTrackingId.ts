import prisma from "../shared/prisma";

export const generateUniqueTrackingId = async (length: number): Promise<string> => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let trackingId = "";

  for (let i = 0; i < length; i++) {
    trackingId += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const fullTrackingId = "TRK-" + trackingId;

  // DB তে exists কিনা চেক করা
  const isExist = await prisma.addParcel.findUnique({
    where: { trackingId: fullTrackingId },
  });

  if (isExist) {
    // Recursively নতুন ID generate করো
    return generateUniqueTrackingId(length);
  }

  return fullTrackingId;
};