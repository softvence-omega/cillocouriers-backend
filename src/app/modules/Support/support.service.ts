import {
  SupportCategory,
  SupportPriority,
  SupportStatus,
  Ticket,
} from "@prisma/client";
import { generateUniqueTicketId } from "../../../helpers/generateUniqueTicketId";
import prisma from "../../../shared/prisma";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { SupportRequestSearchableFields } from "../../constants/searchableFieldConstant";
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
  console.log({ data });

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

  return result;
};

const mySupportRequests = async (marchentId: string, options: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions = buildDynamicFilters(
    options,
    SupportRequestSearchableFields
  );

  const total = await prisma.ticket.count({
    where: {
      marchentId,
      ...whereConditions,
    },
  });

  const result = await prisma.ticket.findMany({
    where: {
      marchentId,
      ...whereConditions,
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
     include: {
      comments: {
        include: {
          author: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });

  const meta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  return {
    data: result,
    meta,
  };
};
const allSupportRequests = async (options: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions = buildDynamicFilters(
    options,
    SupportRequestSearchableFields
  );

  const total = await prisma.ticket.count({
    where: {
      ...whereConditions,
    },
  });

  const result = await prisma.ticket.findMany({
    where: {
      ...whereConditions,
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      comments: {
        include: {
          author: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });

  const meta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  return {
    data: result,
    meta,
  };
};

export const SupportService = {
  addSupport,
  mySupportRequests,
  allSupportRequests,
};
