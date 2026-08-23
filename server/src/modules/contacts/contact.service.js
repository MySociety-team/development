import mongoose from "mongoose";

import Contact from "../../models/Contact.js";
import ApiError from "../../utils/apiError.js";

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
