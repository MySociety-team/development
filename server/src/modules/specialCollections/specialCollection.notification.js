import Announcement from "../../models/Announcement.js";

const createSpecialCollectionNotification = async ({
  societyId,
  collection,
  createdBy,
  title,
  description,
  date = new Date()
}) => {
  if (!societyId || !collection || !createdBy) {
    return null;
  }

  const existing = await Announcement.findOne({
    societyId,
    type: "REMINDER",
    title,
    date
  });

  if (existing) {
    return existing;
  }

  return Announcement.create({
    societyId,
    title,
    description,
    type: "REMINDER",
    date,
    createdBy
  });
};

export const notifySpecialCollectionCreated = async ({ societyId, collection, createdBy }) => {
  return createSpecialCollectionNotification({
    societyId,
    collection,
    createdBy,
    title: `Special Collection: ${collection.title}`,
    description: `A new special collection "${collection.title}" has been created. Amount: ₹${collection.amount}. Due date: ${new Date(
      collection.dueDate
    ).toLocaleDateString("en-IN")}.`
  });
};

export const notifySpecialCollectionDueSoon = async ({ societyId, collection, createdBy }) => {
  return createSpecialCollectionNotification({
    societyId,
    collection,
    createdBy,
    title: `Payment Due Soon: ${collection.title}`,
    description: `The special collection "${collection.title}" is approaching its due date. Please complete the payment before the due date.`,
    date: new Date(collection.dueDate)
  });
};

export const notifySpecialCollectionOverdue = async ({ societyId, collection, createdBy }) => {
  return createSpecialCollectionNotification({
    societyId,
    collection,
    createdBy,
    title: `Payment Overdue: ${collection.title}`,
    description: `The special collection "${collection.title}" has passed its due date. Pending payments are now overdue.`
  });
};

export const notifySpecialCollectionManualReminder = async ({
  societyId,
  collection,
  createdBy,
  message
}) => {
  return createSpecialCollectionNotification({
    societyId,
    collection,
    createdBy,
    title: `Payment Reminder: ${collection.title}`,
    description: message || `This is a reminder to complete the payment for "${collection.title}".`
  });
};
