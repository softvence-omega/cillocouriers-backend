import { Address } from "@prisma/client";
import prisma from "../../../shared/prisma";
import AppError from "../../Errors/AppError";
import status from "http-status";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { AddressSearchableFields } from "../../constants/searchableFieldConstant";

const addAddrss = async (data: Address) => {
    // Step 1: Check if similar address already exists
    const isExist = await prisma.address.findFirst({
        where: {
            marchentId: data.marchentId,
            addressName: data.addressName,
            streetName: data.streetName,
            cityOrSuburb: data.cityOrSuburb,
            postalCode: data.postalCode,
            country: data.country,
            isDeleted: false,
        },
    });

    // Step 2: If exists, throw AppError
    if (isExist) {
        throw new AppError(status.CONFLICT, 'This Address already exists for you..');
    }

    // Step 3: Create new address
    const result = await prisma.address.create({ data });
    return result;
}

const getMySelfAddress = async (marchentId: string, options: any) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

    const whereConditions = buildDynamicFilters(options, AddressSearchableFields);

    const total = await prisma.address.count({
        where: {
            marchentId,
            isDeleted: false,
            ...whereConditions,
        },
    });

    const result = await prisma.address.findMany({
        where: {
            marchentId,
            isDeleted: false,
            ...whereConditions,
        },
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
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

const updateAddress = async (id: string, marchentId: string, data: Partial<Address>) => {

    const isExist = await prisma.address.findFirst({
        where: {
            id,
            marchentId,
            isDeleted: false
        }
    })

    if (!isExist) {
        throw new AppError(status.NOT_FOUND, 'Address not found!')
    }

    const result = await prisma.address.update({
        where: {
            id: isExist.id
        },
        data
    })

    return result


}
const deleteAddress = async (id: string, marchentId: string) => {

    const isExist = await prisma.address.findFirst({
        where: {
            id,
            marchentId,
            isDeleted: false
        }
    })

    if (!isExist) {
        throw new AppError(status.NOT_FOUND, 'Address not found!')
    }

    await prisma.address.update({
        where: {
            id: isExist.id
        },
        data: {
            isDeleted: true
        }
    })

    return null


}

const getSingleAddress = async (id: string, marchentId: string) => {
    const isExist = await prisma.address.findFirst({
        where: {
            id,
            marchentId,
            isDeleted: false

        }
    })

    if (!isExist) {
        throw new AppError(status.NOT_FOUND, 'Address not found!')
    }
    return isExist
}

export const addressService = {
    addAddrss,
    getMySelfAddress,
    updateAddress,
    deleteAddress,
    getSingleAddress
}