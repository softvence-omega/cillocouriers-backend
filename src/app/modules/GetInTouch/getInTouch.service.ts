import { GetInTouch } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { getInTouchMessageSearchableFields } from "../../constants/searchableFieldConstant";

const insertGetInTouchMessage = async (data: GetInTouch) => {
  //   console.log(data, "data");

  const result = await prisma.getInTouch.create({
    data,
  });
  return result;
};

const GetAllMessages = async (options: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions = buildDynamicFilters(
    options,
    getInTouchMessageSearchableFields
  );
  const result = await prisma.getInTouch.findMany({
    where: {
      ...whereConditions,
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.getInTouch.count({
    where: whereConditions,
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

export const getInTouchService = {
  insertGetInTouchMessage,
  GetAllMessages,
};
