import Meeting from "../../models/Meeting.js";

export const findMeetingsBySociety = async (societyId) => {
  return Meeting.find({ societyId }).sort({ dateTime: 1 });
};

export const findMeetingById = async (meetingId, societyId) => {
  return Meeting.findOne({
    _id: meetingId,
    societyId
  });
};

export const createMeeting = async (meetingData) => {
  return Meeting.create(meetingData);
};

export const updateMeeting = async (meetingId, societyId, updateData) => {
  return Meeting.findOneAndUpdate(
    {
      _id: meetingId,
      societyId
    },
    updateData,
    {
      new: true,
      runValidators: true
    }
  );
};

export const deleteMeeting = async (meetingId, societyId) => {
  return Meeting.findOneAndDelete({
    _id: meetingId,
    societyId
  });
};

export const updateMeetingAttendance = async (meetingId, societyId, attendance) => {
  return Meeting.findOneAndUpdate(
    {
      _id: meetingId,
      societyId
    },
    {
      $set: {
        attendance
      }
    },
    {
      new: true,
      runValidators: true
    }
  );
};
