import mongoose from "mongoose";

const { Schema } = mongoose;

const announcementSchema = new Schema(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: [true, "Society ID is required"]
    },

    title: {
      type: String,
      required: [true, "Announcement title is required"],
      trim: true,
      maxLength: [150, "Title cannot exceed 150 characters"]
    },

    description: {
      type: String,
      required: [true, "Announcement description is required"],
      trim: true,
      maxLength: [2000, "Description cannot exceed 2000 characters"]
    },

    type: {
      type: String,
      enum: {
        values: ["GENERAL", "EMERGENCY", "EVENT", "REMINDER", "UPDATE"],
        message: "Invalid announcement type"
      },
      default: "GENERAL",
      required: true
    },

    date: {
      type: Date,
      required: [true, "Announcement date is required"]
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Announcement creator is required"]
    }
  },
  {
    timestamps: true
  }
);

announcementSchema.index({
  societyId: 1,
  date: -1
});

announcementSchema.index({
  societyId: 1,
  type: 1
});

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
