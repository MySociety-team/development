import SpecialCollection from "../../models/SpecialCollection.js";
import Announcement from "../../models/Announcement.js";

const createReminderIfNeeded = async ({ collection, title, description, date }) => {
  const existing = await Announcement.findOne({
    societyId: collection.societyId,
    type: "REMINDER",
    title
  });

  if (existing) {
    return;
  }

  await Announcement.create({
    societyId: collection.societyId,
    title,
    description,
    type: "REMINDER",
    date,
    createdBy: collection.createdBy
  });
};

export const checkSpecialCollectionReminders = async () => {
  try {
    const collections = await SpecialCollection.find({
      status: "ACTIVE"
    });

    const now = new Date();

    for (const collection of collections) {
      const dueDate = new Date(collection.dueDate);

      const timeUntilDue = dueDate.getTime() - now.getTime();
      const oneDay = 24 * 60 * 60 * 1000;

      // Due within 24 hours
      if (timeUntilDue > 0 && timeUntilDue <= oneDay) {
        await createReminderIfNeeded({
          collection,
          title: `Payment Due Soon: ${collection.title}`,
          description: `The special collection "${collection.title}" is due soon. Please complete the payment before the due date.`,
          date: dueDate
        });
      }

      // Already overdue
      if (timeUntilDue <= 0) {
        await createReminderIfNeeded({
          collection,
          title: `Payment Overdue: ${collection.title}`,
          description: `The special collection "${collection.title}" has passed its due date. Pending payments are now overdue.`,
          date: now
        });
      }
    }

    console.log("Special collection reminder checker completed");
  } catch (error) {
    console.error("Special collection reminder checker failed:", error.message);
  }
};

export const startSpecialCollectionScheduler = () => {
  checkSpecialCollectionReminders();

  const interval = setInterval(checkSpecialCollectionReminders, 60 * 60 * 1000);

  interval.unref();

  console.log("Special collection reminder scheduler started");
};
