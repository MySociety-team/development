import mongoose from "mongoose";

const { Schema } = mongoose;

const attendanceSchema = new Schema(
  {
    societyMemberId: {
      type: Schema.Types.ObjectId,
      ref: "SocietyMember",
      required: [true, "Society Member ID is required"]
    },

    status: {
      type: String,
      enum: ["PRESENT", "ABSENT"],
      default: "ABSENT",
      required: true
    }
  },
  {
    _id: false
  }
);

const meetingSchema = new Schema(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: [true, "Society ID is required"]
    },

    title: {
      type: String,
      required: [true, "Meeting title is required"],
      trim: true
    },

    description: {
      type: String,
      trim: true,
      default: ""
    },

    dateTime: {
      type: Date,
      required: [true, "Meeting date and time is required"]
    },

    venue: {
      type: String,
      required: [true, "Meeting venue is required"],
      trim: true
    },

    duration: {
      type: Number,
      required: [true, "Meeting duration is required"],
      min: [1, "Meeting duration must be at least 1 minute"]
    },

    topics: {
      type: [String],
      default: []
    },

    status: {
      type: String,
      enum: ["UPCOMING", "COMPLETED", "CANCELLED"],
      default: "UPCOMING",
      required: true
    },

    attendance: {
      type: [attendanceSchema],
      default: []
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Meeting creator is required"]
    }
  },
  {
    timestamps: true
  }
);

meetingSchema.index({
  societyId: 1,
  dateTime: 1
});

meetingSchema.index({
  societyId: 1,
  status: 1
});

const Meeting = mongoose.model("Meeting", meetingSchema);

export default Meeting;
