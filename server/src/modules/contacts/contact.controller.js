import asyncHandler from "../../utils/asyncHandler.js";

import { createContact, deleteContact, getContacts, updateContact } from "./contact.service.js";

export const getContactsController = asyncHandler(async (req, res) => {
  const { societyId } = req.params;
  const { search = "" } = req.query;

  const contacts = await getContacts({
    societyId,
    search
  });

  return res.status(200).json({
    success: true,
    code: "CONTACTS_FETCHED",
    message: "Contacts fetched successfully",
    data: {
      contacts
    }
  });
});

export const createContactController = asyncHandler(async (req, res) => {
  const { societyId } = req.params;

  const contact = await createContact({
    societyId,
    contactData: req.body
  });

  return res.status(201).json({
    success: true,
    code: "CONTACT_CREATED",
    message: "Contact created successfully",
    data: {
      contact
    }
  });
});

export const updateContactController = asyncHandler(async (req, res) => {
  const { societyId, contactId } = req.params;

  const contact = await updateContact({
    societyId,
    contactId,
    contactData: req.body
  });

  return res.status(200).json({
    success: true,
    code: "CONTACT_UPDATED",
    message: "Contact updated successfully",
    data: {
      contact
    }
  });
});

export const deleteContactController = asyncHandler(async (req, res) => {
  const { societyId, contactId } = req.params;

  await deleteContact({
    societyId,
    contactId
  });

  return res.status(200).json({
    success: true,
    code: "CONTACT_DELETED",
    message: "Contact deleted successfully"
  });
});
