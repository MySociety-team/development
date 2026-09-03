import mongoose from "mongoose";

import Complaint from "../../models/Complaint.js";
import ApiError from "../../utils/apiError.js";

export const getComplaints = async ({ societyId }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  return Complaint.find({ societyId })
    .populate("userId", "name avatarUrl")
    .populate("flatId", "wing flatNumber")
    .sort({ createdAt: -1 });
};

export const createComplaint = async ({
  societyId,
  userId,
  flatId,
  title,
  category,
  description
}) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "USER_ID_INVALID", "User ID is invalid");
  }
  if (!mongoose.isValidObjectId(flatId)) {
    throw new ApiError(400, "FLAT_ID_INVALID", "Flat ID is invalid");
  }

  const complaint = await Complaint.create({
    societyId,
    userId,
    flatId,
    title,
    category,
    description,
    status: "pending"
  });

  return Complaint.findById(complaint._id)
    .populate("userId", "name avatarUrl")
    .populate("flatId", "wing flatNumber");
};

export const updateComplaintStatus = async ({
  societyId,
  complaintId,
  status,
  resolutionComment
}) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }
  if (!mongoose.isValidObjectId(complaintId)) {
    throw new ApiError(400, "COMPLAINT_ID_INVALID", "Complaint ID is invalid");
  }

  if (!["pending", "resolved", "rejected"].includes(status)) {
    throw new ApiError(400, "INVALID_STATUS", "Status must be pending, resolved or rejected");
  }

  const updateFields = { status };
  if (status !== "pending") {
    updateFields.resolutionComment = resolutionComment || "";
  }

  const complaint = await Complaint.findOneAndUpdate(
    { _id: complaintId, societyId },
    updateFields,
    { new: true, runValidators: true }
  )
    .populate("userId", "name avatarUrl")
    .populate("flatId", "wing flatNumber");

  if (!complaint) {
    throw new ApiError(404, "COMPLAINT_NOT_FOUND", "Complaint not found");
  }

  return complaint;
};

export const deleteComplaint = async ({ societyId, userId, userRole, complaintId }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }
  if (!mongoose.isValidObjectId(complaintId)) {
    throw new ApiError(400, "COMPLAINT_ID_INVALID", "Complaint ID is invalid");
  }

  const complaint = await Complaint.findOne({ _id: complaintId, societyId });
  if (!complaint) {
    throw new ApiError(404, "COMPLAINT_NOT_FOUND", "Complaint not found");
  }

  const isOwner = complaint.userId.toString() === userId.toString();
  const isSecretary = userRole === "SECRETARY";

  if (!isSecretary && !isOwner) {
    throw new ApiError(403, "FORBIDDEN", "You do not have permission to delete this complaint");
  }

  if (!isSecretary && isOwner && complaint.status !== "pending") {
    throw new ApiError(400, "BAD_REQUEST", "You can only delete pending complaints");
  }

  await Complaint.findByIdAndDelete(complaintId);
  return complaint;
};
