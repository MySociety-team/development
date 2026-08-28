import mongoose from "mongoose";

import Complaint from "../../models/Complaint.js";
import SocietyMember from "../../models/SocietyMember.js";
import ApiError from "../../utils/apiError.js";

/**
 * Fetch all complaints for a society
 */
export const getComplaints = async ({ societyId }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  return Complaint.find({ societyId })
    .populate({
      path: "userId",
      select: "name email mobileNumber avatarUrl"
    })
    .populate({
      path: "flatId",
      select: "flatNumber floor wing flatType"
    })
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Create a new complaint in a society
 */
export const createComplaint = async ({ societyId, userId, payload }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "USER_ID_INVALID", "User ID is invalid");
  }

  const { title, category, description } = payload || {};

  if (!title || !title.trim()) {
    throw new ApiError(400, "COMPLAINT_TITLE_REQUIRED", "Complaint title is required");
  }

  if (!description || !description.trim()) {
    throw new ApiError(400, "COMPLAINT_DESCRIPTION_REQUIRED", "Complaint description is required");
  }

  if (!category) {
    throw new ApiError(400, "COMPLAINT_CATEGORY_REQUIRED", "Complaint category is required");
  }

  const membership = await SocietyMember.findOne({
    societyId,
    userId,
    status: "ACTIVE"
  });

  if (!membership) {
    throw new ApiError(
      403,
      "SOCIETY_MEMBERSHIP_REQUIRED",
      "You must be an active member of this society to raise a complaint"
    );
  }

  if (!membership.flatId) {
    throw new ApiError(
      400,
      "MEMBER_FLAT_REQUIRED",
      "Your membership must be linked to a flat to file a complaint"
    );
  }

  const complaint = await Complaint.create({
    societyId,
    userId,
    flatId: membership.flatId,
    title: title.trim(),
    category,
    description: description.trim(),
    status: "pending"
  });

  return Complaint.findById(complaint._id)
    .populate({
      path: "userId",
      select: "name email mobileNumber avatarUrl"
    })
    .populate({
      path: "flatId",
      select: "flatNumber floor wing flatType"
    })
    .lean();
};

/**
 * Update the status of a complaint
 */
export const updateComplaintStatus = async ({ societyId, complaintId, userId, userRole, status }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  if (!mongoose.isValidObjectId(complaintId)) {
    throw new ApiError(400, "COMPLAINT_ID_INVALID", "Complaint ID is invalid");
  }

  const validStatuses = ["pending", "resolved", "rejected"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(
      400,
      "COMPLAINT_STATUS_INVALID",
      `Status must be one of: ${validStatuses.join(", ")}`
    );
  }

  const complaint = await Complaint.findOne({ _id: complaintId, societyId });

  if (!complaint) {
    throw new ApiError(404, "COMPLAINT_NOT_FOUND", "Complaint not found");
  }

  const isOwner = complaint.userId.toString() === userId;
  const isSecretary = userRole === "SECRETARY";

  if (isSecretary) {
    if (status === "pending") {
      throw new ApiError(400, "COMPLAINT_STATUS_PENDING", "Cannot set status back to pending");
    }
  } else {
    throw new ApiError(
      403,
      "COMPLAINT_ACCESS_DENIED",
      "Only the secretary has permission to update the status of a complaint"
    );
  }

  complaint.status = status;
  await complaint.save();

  return Complaint.findById(complaint._id)
    .populate({
      path: "userId",
      select: "name email mobileNumber avatarUrl"
    })
    .populate({
      path: "flatId",
      select: "flatNumber floor wing flatType"
    })
    .lean();
};

/**
 * Delete a complaint
 */
export const deleteComplaint = async ({ societyId, complaintId, userId, userRole }) => {
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

  const isOwner = complaint.userId.toString() === userId;
  const isSecretary = userRole === "SECRETARY";

  if (isSecretary) {
  } else if (isOwner) {
    if (complaint.status !== "pending") {
      throw new ApiError(
        400,
        "COMPLAINT_NOT_PENDING",
        "Only pending complaints can be deleted by the resident"
      );
    }
  } else {
    throw new ApiError(
      403,
      "COMPLAINT_ACCESS_DENIED",
      "You do not have permission to delete this complaint"
    );
  }

  await Complaint.deleteOne({ _id: complaintId });
  return { success: true };
};
