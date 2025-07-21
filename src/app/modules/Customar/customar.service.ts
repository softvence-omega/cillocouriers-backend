import { Address, Customer } from "@prisma/client";
import prisma from "../../../shared/prisma";
import AppError from "../../Errors/AppError";
import status from "http-status";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { buildDynamicFilters } from "../../../helpers/buildDynamicFilters";
import { CustomerSearchableFields } from "../../constants/searchableFieldConstant";

const addCustomer = async (data: Customer) => {
    // Step 1: Check if similar address already exists
    const isExist = await prisma.customer.findFirst({
        where: {
            marchentId: data.marchentId,
            Name: data.Name,
            Email: data.Email,
            Phone: data.Phone,
            isDeleted: false,
        },
    });

    // Step 2: If exists, throw AppError
    if (isExist) {
        throw new AppError(status.CONFLICT, 'This Customar already exists for you..');
    }

    // Step 3: Create new address
    const result = await prisma.customer.create({ data });
    return result;
}

const getMySelfCustomers = async (marchentId: string, options: any) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

    const whereConditions = buildDynamicFilters(options, CustomerSearchableFields);

    const total = await prisma.customer.count({
        where: {
            marchentId,
            isDeleted: false,
            ...whereConditions,
        },
    });

    const result = await prisma.customer.findMany({
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

const updateCustomar = async (id: string, marchentId: string, data: Partial<Address>) => {

    const isExist = await prisma.customer.findFirst({
        where: {
            id,
            marchentId,
            isDeleted: false
        }
    })

    if (!isExist) {
        throw new AppError(status.NOT_FOUND, 'Customar not found!')
    }

    const result = await prisma.customer.update({
        where: {
            id: isExist.id
        },
        data
    })

    return result


}
const deleteCustomar = async (id: string, marchentId: string) => {

    const isExist = await prisma.customer.findFirst({
        where: {
            id,
            marchentId,
            isDeleted: false
        }
    })

    if (!isExist) {
        throw new AppError(status.NOT_FOUND, 'Customar not found!')
    }

    await prisma.customer.update({
        where: {
            id: isExist.id
        },
        data: {
            isDeleted: true
        }
    })

    return null


}


const getSingleCustomer = async (id: string, marchentId: string) => {
    const isExist = await prisma.customer.findFirst({
        where: {
            id,
            marchentId,
            isDeleted: false
        }
    })

    if (!isExist) {
        throw new AppError(status.NOT_FOUND, 'Customer not found!')
    }
    return isExist
}


export const customarService = {
    addCustomer,
    getMySelfCustomers,
    updateCustomar,
    deleteCustomar,
    getSingleCustomer
}