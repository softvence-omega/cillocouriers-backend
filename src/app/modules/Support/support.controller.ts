import { Request } from "express";
import catchAsync from "../../../shared/catchAsync";
import { SupportService } from "./support.service";
import sendResponse from "../../../shared/sendResponse";
import status from "http-status";
import { uploadImageToSupabase } from "../../middlewares/uploadImageToSupabase";
import fs from "fs";
const addSupport = catchAsync(async (req: Request & { user?: any }, res) => {
  // Check if file is present in the request
  let attachementliveLink = null;
  if (req?.file) {
    const ImageName = `Image-${Date.now()}`;
    try {
      // Call the uploadImageToSupabase only if the file exists
      attachementliveLink = await uploadImageToSupabase(
        req?.file?.path as any,
        ImageName
      );

      // Send the response with the uploaded image URL

      // Delete the local file after upload
      fs.unlinkSync(req?.file?.path as any);
    } catch (err) {
      console.error("❌ Upload error:", err);
      res.status(500).json({ success: false, message: "fetch failed" });
    }
  }

  // Parse JSON from form-data
  const parsedData = JSON.parse(req.body.data); // parse JSON string
  const supportData = {
    ...parsedData, // title, description, category
    marchentId: req.user?.id,
    attachementliveLink: attachementliveLink,
  };

  const result = await SupportService.addSupport(supportData);

  // Send the success response for the support data
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Support Added successfully.",
    data: result, 
  });
});

const mySupportRequests = catchAsync(
  async (req: Request & { user?: any }, res) => {
    const result = await SupportService.mySupportRequests(
      req.user?.id,
      req.query
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Support requests fetched successfully.",
      data: result,
    });
  }
);

export const SupportController = {
  addSupport,
  mySupportRequests,
};
