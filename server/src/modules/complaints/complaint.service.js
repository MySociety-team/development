import mongoose from "mongoose";

import Complaint from "../../models/Complaint.js";
import SocietyMember from "../../models/SocietyMember.js";
import ApiError from "../../utils/apiError.js";
import { createBulkNotifications } from "../notifications/notification.service.js";

export const getComplaints = async ({ societyId }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  const complaints = await Complaint.find({ societyId })
    .populate("userId", "name email avatarUrl")
    .populate("flatId", "wing flatNumber floor flatType")
    .populate("resolvedBy", "name email avatarUrl")
    .sort({ createdAt: -1 });

  return complaints;
};

export const createComplaint = async ({ societyId, userId, flatId, payload }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  const { title, description, category } = payload;

  if (!title || !title.trim()) {
    throw new ApiError(400, "TITLE_REQUIRED", "Complaint title is required");
  }

  if (!description || !description.trim()) {
    throw new ApiError(400, "DESCRIPTION_REQUIRED", "Complaint description is required");
  }

  const complaint = await Complaint.create({
    societyId,
    userId,
    flatId,
    title: title.trim(),
    description: description.trim(),
    category: category || "OTHER",
    status: "pending"
  });

  const populatedComplaint = await Complaint.findById(complaint._id)
    .populate("userId", "name email avatarUrl")
    .populate("flatId", "wing flatNumber floor flatType");

  // Notify all society members and secretary
  try {
    const activeMembers = await SocietyMember.find({
      societyId,
      status: "ACTIVE"
    }).select("userId role");

    if (activeMembers.length > 0) {
      const creatorName = populatedComplaint.userId?.name || "A resident";
      const flatLabel = populatedComplaint.flatId
        ? ` (Flat ${populatedComplaint.flatId.wing || ""}-${populatedComplaint.flatId.flatNumber || ""})`
        : "";

      const notifications = activeMembers.map((member) => {
        const isCreator = member.userId.toString() === userId.toString();
        const isSec = member.role === "SECRETARY";

        let title = "New Complaint Lodged";
        let message = `${creatorName}${flatLabel} lodged a complaint: "${complaint.title}"`;

        if (isCreator) {
          title = "Complaint Registered";
          message = `Your complaint "${complaint.title}" has been registered successfully.`;
        } else if (isSec) {
          title = "New Complaint Action Required";
          message = `${creatorName}${flatLabel} lodged a complaint: "${complaint.title}"`;
        }

        return {
          recipientId: member.userId,
          societyId,
          type: "COMPLAINT_FILED",
          title,
          message,
          link: `/societies/${societyId}/complaints`,
          metadata: {
            complaintId: complaint._id
          }
        };
      });

      await createBulkNotifications(notifications);
    }
  } catch (err) {
    // Non-blocking notification error
    console.error("Failed to send complaint notifications:", err);
  }

  return populatedComplaint;
};

export const updateComplaintStatus = async ({
  societyId,
  complaintId,
  status,
  resolutionNote,
  userId,
  userRole
}) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  if (!mongoose.isValidObjectId(complaintId)) {
    throw new ApiError(400, "COMPLAINT_ID_INVALID", "Complaint ID is invalid");
  }

  const existingComplaint = await Complaint.findOne({
    _id: complaintId,
    societyId
  });

  if (!existingComplaint) {
    throw new ApiError(404, "COMPLAINT_NOT_FOUND", "Complaint not found");
  }

  // Permission rules based on category:
  if (existingComplaint.category === "SECRETARY") {
    // Complaints regarding the Secretary can ONLY be resolved by the complainant who created it
    if (existingComplaint.userId.toString() !== userId.toString()) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Complaints regarding the Secretary can only be resolved by the resident who filed the complaint"
      );
    }

    if (status === "rejected") {
      throw new ApiError(
        400,
        "INVALID_STATUS",
        "Residents can only mark their complaint as resolved or pending"
      );
    }
  } else {
    // Standard society complaints can only be updated by the Secretary
    if (userRole !== "SECRETARY") {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Only the society secretary can update complaint statuses"
      );
    }
  }

  const validStatuses = ["pending", "resolved", "rejected"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "INVALID_STATUS", "Status must be pending, resolved, or rejected");
  }

  if (status === "resolved" || status === "rejected") {
    if (!resolutionNote || !resolutionNote.trim()) {
      throw new ApiError(
        400,
        "RESOLUTION_NOTE_REQUIRED",
        status === "resolved"
          ? "Resolution details are required to mark a complaint as resolved"
          : "A rejection reason is required to reject a complaint"
      );
    }
  }

  const updateFields = {
    status,
    resolutionNote: resolutionNote ? resolutionNote.trim() : "",
    resolvedBy: status === "pending" ? null : userId,
    resolvedAt: status === "pending" ? null : new Date()
  };

  const complaint = await Complaint.findOneAndUpdate(
    {
      _id: complaintId,
      societyId
    },
    updateFields,
    { new: true, runValidators: true }
  )
    .populate("userId", "name email avatarUrl")
    .populate("flatId", "wing flatNumber floor flatType")
    .populate("resolvedBy", "name email avatarUrl");

  if (!complaint) {
    throw new ApiError(404, "COMPLAINT_NOT_FOUND", "Complaint not found");
  }

  // Send relevant notifications
  try {
    const isResolved = status === "resolved";
    const isRejected = status === "rejected";

    if (isResolved || isRejected) {
      const activeMembers = await SocietyMember.find({
        societyId,
        status: "ACTIVE"
      }).select("userId role");

      if (activeMembers.length > 0) {
        const notifications = activeMembers.map((member) => {
          const isCreator =
            complaint.userId?._id && member.userId.toString() === complaint.userId._id.toString();
          const isSec = member.role === "SECRETARY";

          let title = isResolved ? "Complaint Resolved" : "Complaint Rejected";
          let message = isResolved
            ? `Complaint "${complaint.title}" was resolved: ${complaint.resolutionNote}`
            : `Complaint "${complaint.title}" was rejected: ${complaint.resolutionNote}`;

          if (isCreator) {
            title = isResolved ? "Your Complaint Was Resolved" : "Your Complaint Was Rejected";
            message = isResolved
              ? `Your complaint "${complaint.title}" has been resolved. Resolution: ${complaint.resolutionNote}`
              : `Your complaint "${complaint.title}" was rejected. Reason: ${complaint.resolutionNote}`;
          } else if (isSec && complaint.category === "SECRETARY") {
            title = "Secretary Complaint Closed";
            message = `${complaint.userId?.name || "Resident"} marked complaint "${complaint.title}" as resolved: ${complaint.resolutionNote}`;
          }

          return {
            recipientId: member.userId,
            societyId,
            type: isResolved ? "COMPLAINT_RESOLVED" : "COMPLAINT_REJECTED",
            title,
            message,
            link: `/societies/${societyId}/complaints`,
            metadata: {
              complaintId: complaint._id,
              status: complaint.status
            }
          };
        });

        await createBulkNotifications(notifications);
      }
    }
  } catch (err) {
    console.error("Failed to send complaint status notification:", err);
  }

  return complaint;
};

export const deleteComplaint = async ({ societyId, complaintId, userId, userRole }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  if (!mongoose.isValidObjectId(complaintId)) {
    throw new ApiError(400, "COMPLAINT_ID_INVALID", "Complaint ID is invalid");
  }

  const complaint = await Complaint.findOne({
    _id: complaintId,
    societyId
  });

  if (!complaint) {
    throw new ApiError(404, "COMPLAINT_NOT_FOUND", "Complaint not found");
  }

  const isOwner = complaint.userId.toString() === userId.toString();
  const isSecretary = userRole === "SECRETARY";

  if (complaint.category === "SECRETARY") {
    // Complaints regarding the Secretary can ONLY be deleted by the resident who filed it
    if (!isOwner) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Complaints regarding the Secretary can only be deleted by the resident who filed the complaint"
      );
    }
  } else {
    if (!isOwner && !isSecretary) {
      throw new ApiError(403, "FORBIDDEN", "You are not authorized to delete this complaint");
    }

    // Residents can only delete pending complaints
    if (!isSecretary && complaint.status !== "pending") {
      throw new ApiError(
        400,
        "CANNOT_DELETE_RESOLVED",
        "You cannot delete a complaint that is already resolved or rejected"
      );
    }
  }

  await Complaint.findByIdAndDelete(complaintId);

  return { message: "Complaint deleted successfully" };
};
