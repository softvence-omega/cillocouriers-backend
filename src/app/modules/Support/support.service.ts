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
import AppError from "../../Errors/AppError";
import status from "http-status";
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
  // console.log({ data });

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

  const [openCount, pendingCount, resolvedCount] = await Promise.all([
    prisma.ticket.count({ where: { status: "OPEN", marchentId } }),
    prisma.ticket.count({ where: { status: "PENDING", marchentId } }),
    prisma.ticket.count({ where: { status: "RESOLVED", marchentId } }),
  ]);

  const totalData = await prisma.ticket.count({ where: { marchentId } });

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

  const cardData = {
    totalData,
    open: openCount,
    pending: pendingCount,
    resolved: resolvedCount,
  };

  return {
    data: result,
    meta,
    cardData,
  };
};

const allSupportRequests = async (options: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions = buildDynamicFilters(
    options,
    SupportRequestSearchableFields
  );

  // ===== Status counts (pagination-এর বাইরে) =====
  // যদি সিনট্যাক্স/স্ট্যাটাস ভিন্ন হয় তাহলে 'OPEN'|'PENDING'|'RESOLVED' বদলে দাও
  const [total, openCount, pendingCount, resolvedCount] = await Promise.all([
    prisma.ticket.count({ where: { ...whereConditions } }),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.ticket.count({ where: { status: "PENDING" } }),
    prisma.ticket.count({ where: { status: "RESOLVED" } }),
  ]);

  const totalData = await prisma.ticket.count();

  // ===== Paginated query (যেমন আগেও ছিল) =====
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

  const cardData = {
    totalData,
    open: openCount,
    pending: pendingCount,
    resolved: resolvedCount,
  };

  return {
    data: result,
    meta,
    cardData,
  };
};

const changeSupportStatus = async (
  ticketId: string,
  data: { status: SupportStatus }
) => {
  const isTicketExist = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });

  // console.log(isTicketExist);
  if (!isTicketExist) {
    throw new AppError(status.NOT_FOUND, "Ticket not found");
  }

  const result = await prisma.ticket.update({
    where: {
      id: ticketId,
    },
    data: {
      status: data.status,
    },
  });

  return result;
};

export const SupportService = {
  addSupport,
  mySupportRequests,
  allSupportRequests,
  changeSupportStatus,
};
