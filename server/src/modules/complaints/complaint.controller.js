import asyncHandler from "../../utils/asyncHandler.js";
import {
  getComplaints,
  createComplaint,
  updateComplaintStatus,
  deleteComplaint
} from "./complaint.service.js";

export const getComplaintsController = asyncHandler(async (req, res) => {
  const { societyId } = req.params;

  const complaints = await getComplaints({ societyId });

  return res.status(200).json({
    success: true,
    code: "COMPLAINTS_FETCHED",
    message: "Complaints fetched successfully",
    data: {
      complaints
    }
  });
});

export const createComplaintController = asyncHandler(async (req, res) => {
  const { societyId } = req.params;
  const userId = req.user.id;
  const flatId = req.societyMember.flatId;
  const { title, category, description } = req.body;

  const complaint = await createComplaint({
    societyId,
    userId,
    flatId,
    title,
    category,
    description
  });

  return res.status(201).json({
    success: true,
    code: "COMPLAINT_CREATED",
    message: "Complaint lodged successfully",
    data: {
      complaint
    }
  });
});

export const updateComplaintStatusController = asyncHandler(async (req, res) => {
  const { societyId, complaintId } = req.params;
  const { status, resolutionComment } = req.body;

  const complaint = await updateComplaintStatus({
    societyId,
    complaintId,
    status,
    resolutionComment
  });

  return res.status(200).json({
    success: true,
    code: "COMPLAINT_STATUS_UPDATED",
    message: "Complaint status updated successfully",
    data: {
      complaint
    }
  });
});

export const deleteComplaintController = asyncHandler(async (req, res) => {
  const { societyId, complaintId } = req.params;
  const userId = req.user.id;
  const userRole = req.societyMember.role;

  await deleteComplaint({
    societyId,
    userId,
    userRole,
    complaintId
  });

  return res.status(200).json({
    success: true,
    code: "COMPLAINT_DELETED",
    message: "Complaint deleted successfully"
  });
});
