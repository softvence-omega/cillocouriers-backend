import {
  SupportCategory,
  SupportPriority,
  SupportStatus,
  Ticket,
} from "@prisma/client";
import { generateUniqueTicketId } from "../../../helpers/generateUniqueTicketId";
import prisma from "../../../shared/prisma";
// Mapping from category to priority
const categoryPriorityMap: Record<SupportCategory, SupportPriority> = {
  DELIVERY_ISSUES: "HIGH",
  PAYMENT_ISSUES: "URGENT",
  GENERAL_INQUIRY: "LOW",
  TECHNICAL_SUPPORT: "MEDIUM",
  BILLING_CHARGES: "MEDIUM",
  REFUND_REQUEST: "HIGH",
  PRODUCT_INQUIRY: "LOW",
  ACCOUNT_ISSUES: "HIGH",
  OTHER: "LOW",
};
const addSupport = async (data: Ticket) => {
  const priority = categoryPriorityMap[data.category] || "MEDIUM";

  const ticketId = await generateUniqueTicketId(5);

  const ticketData = {
    ...data,
    priority,
    status: SupportStatus.OPEN,
    ticketId,
  };

  const result = await prisma.ticket.create({
    data: { ...ticketData },
  });

  return result; // ✅ এই লাইনটা যোগ করো
};

export const SupportService = {
  addSupport,
};
