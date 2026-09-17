import asyncHandler from "../../utils/asyncHandler.js";

import {
  createComplaint,
  deleteComplaint,
  getComplaints,
  updateComplaintStatus
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

  const complaint = await createComplaint({
    societyId,
    userId: req.user.id,
    flatId: req.societyMember.flatId,
    payload: req.body
  });

  return res.status(201).json({
    success: true,
    code: "COMPLAINT_CREATED",
    message: "Complaint created successfully",
    data: {
      complaint
    }
  });
});

export const updateComplaintStatusController = asyncHandler(async (req, res) => {
  const { societyId, complaintId } = req.params;
  const { status, resolutionNote } = req.body;

  const complaint = await updateComplaintStatus({
    societyId,
    complaintId,
    status,
    resolutionNote,
    userId: req.user.id,
    userRole: req.societyMember.role
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

  await deleteComplaint({
    societyId,
    complaintId,
    userId: req.user.id,
    userRole: req.societyMember.role
  });

  return res.status(200).json({
    success: true,
    code: "COMPLAINT_DELETED",
    message: "Complaint deleted successfully"
  });
});
