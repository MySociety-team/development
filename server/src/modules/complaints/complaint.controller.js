import asyncHandler from "../../utils/asyncHandler.js";
import {
  getComplaints,
  createComplaint,
  updateComplaintStatus,
  deleteComplaint
} from "./complaint.service.js";

/**
 * Get all complaints of a society
 */
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

/**
 * Raise a new complaint in a society
 */
export const createComplaintController = asyncHandler(async (req, res) => {
  const { societyId } = req.params;
  const userId = req.user.id;

  const complaint = await createComplaint({
    societyId,
    userId,
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

/**
 * Update the status of a complaint
 */
export const updateComplaintStatusController = asyncHandler(async (req, res) => {
  const { societyId, complaintId } = req.params;
  const userId = req.user.id;
  const userRole = req.societyMember.role;
  const { status } = req.body;

  const complaint = await updateComplaintStatus({
    societyId,
    complaintId,
    userId,
    userRole,
    status
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

/**
 * Delete a complaint from a society
 */
export const deleteComplaintController = asyncHandler(async (req, res) => {
  const { societyId, complaintId } = req.params;
  const userId = req.user.id;
  const userRole = req.societyMember.role;

  await deleteComplaint({
    societyId,
    complaintId,
    userId,
    userRole
  });

  return res.status(200).json({
    success: true,
    code: "COMPLAINT_DELETED",
    message: "Complaint deleted successfully"
  });
});
