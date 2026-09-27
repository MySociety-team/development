import mongoose from "mongoose";

import Contact from "../../models/Contact.js";
import SocietyMember from "../../models/SocietyMember.js";
import ApiError from "../../utils/apiError.js";
import { createBulkNotifications } from "../notifications/notification.service.js";

export const getContacts = async ({ societyId, search = "" }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  const filter = {
    societyId
  };

  if (search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");

    filter.$or = [{ name: searchRegex }, { profession: searchRegex }];
  }

  return Contact.find(filter).sort({
    profession: 1,
    name: 1
  });
};

export const createContact = async ({ societyId, contactData }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  const contact = await Contact.create({
    societyId,
    ...contactData
  });

  try {
    const activeMembers = await SocietyMember.find({
      societyId,
      status: "ACTIVE"
    }).select("userId");

    if (activeMembers.length > 0) {
      const notifications = activeMembers.map((member) => ({
        recipientId: member.userId,
        societyId,
        type: "CONTACT_ADDED",
        title: "New Contact Added",
        message: `${contact.name} (${contact.profession || "Service"}) was added to the society directory.`,
        link: `/societies/${societyId}/contacts`,
        metadata: {
          contactId: contact._id
        }
      }));

      await createBulkNotifications(notifications);
    }
  } catch (err) {
    console.error("Failed to notify members of new contact:", err);
  }

  return contact;
};

export const updateContact = async ({ societyId, contactId, contactData }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  if (!mongoose.isValidObjectId(contactId)) {
    throw new ApiError(400, "CONTACT_ID_INVALID", "Contact ID is invalid");
  }

  const contact = await Contact.findOneAndUpdate(
    {
      _id: contactId,
      societyId
    },
    contactData,
    {
      new: true,
      runValidators: true
    }
  );

  if (!contact) {
    throw new ApiError(404, "CONTACT_NOT_FOUND", "Contact not found");
  }

  return contact;
};

export const deleteContact = async ({ societyId, contactId }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  if (!mongoose.isValidObjectId(contactId)) {
    throw new ApiError(400, "CONTACT_ID_INVALID", "Contact ID is invalid");
  }

  const contact = await Contact.findOneAndDelete({
    _id: contactId,
    societyId
  });

  if (!contact) {
    throw new ApiError(404, "CONTACT_NOT_FOUND", "Contact not found");
  }

  return contact;
};
