import Announcement from "../../models/Announcement.js";

export const findAnnouncementsBySociety = async (societyId) => {
  return Announcement.find({ societyId })
    .populate("createdBy", "name email")
    .sort({ date: -1, createdAt: -1 });
};

export const findAnnouncementById = async (announcementId, societyId) => {
  return Announcement.findOne({
    _id: announcementId,
    societyId
  }).populate("createdBy", "name email");
};

export const createAnnouncement = async (announcementData) => {
  return Announcement.create(announcementData);
};

export const updateAnnouncement = async (announcementId, societyId, announcementData) => {
  return Announcement.findOneAndUpdate(
    {
      _id: announcementId,
      societyId
    },
    announcementData,
    {
      new: true,
      runValidators: true
    }
  ).populate("createdBy", "name email");
};

export const deleteAnnouncement = async (announcementId, societyId) => {
  return Announcement.findOneAndDelete({
    _id: announcementId,
    societyId
  });
};
