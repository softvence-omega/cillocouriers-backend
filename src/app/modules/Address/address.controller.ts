import status from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { addressService } from "./address.service";
import { Request } from "express";

const addAddrss = catchAsync(async (req: Request & { user?: any }, res) => {

    const addressData = {
        ...req.body,
        marchentId: req.user.id
    }
    const result = await addressService.addAddrss(addressData);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Address Added successfully.",
        data: result,

    });
});
const updateAddress = catchAsync(async (req: Request & { user?: any }, res) => {



    const result = await addressService.updateAddress(req.params.id, req.user.id, req.body);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Address Updated successfully.",
        data: result,

    });
});
const deleteAddress = catchAsync(async (req: Request & { user?: any }, res) => {



    const result = await addressService.deleteAddress(req.params.id, req.user.id);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Address Deleted successfully.",
        data: result,

    });
});
const getMySelfAddress = catchAsync(async (req: Request & { user?: any }, res) => {


    const result = await addressService.getMySelfAddress(req.user.id, req.query);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "My Address Fetched successfully.",
        data: result,

    });
});
const getSingleAddress = catchAsync(async (req: Request & { user?: any }, res) => {


    const result = await addressService.getSingleAddress(req.params.id, req.user.id);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Single Address Fetched successfully.",
        data: result,

    });
});






export const addressController = {
    addAddrss,
    getMySelfAddress,
    updateAddress,
    deleteAddress,
    getSingleAddress
}
