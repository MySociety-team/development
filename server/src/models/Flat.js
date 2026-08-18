import mongoose from "mongoose";

const { Schema } = mongoose;

const flatSchema = new Schema(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: [true, "Society Id is required"]
    },
    flatNumber: {
      type: String,
      required: [true, "Flat number is required"],
      trim: true
    },
    floor: {
      type: Number,
      required: [true, "Floor is required"],
      validate: {
        validator: Number.isInteger,
        message: "Floor must be an integer"
      }
    },
    wing: {
      type: String,
      trim: true,
      required: [true, "Wing is required"]
    },
    addressNote: {
      type: String,
      required: [true, "Address note is required"],
      trim: true
    },
    isOccupied: {
      type: Boolean,
      default: false
    },
    flatType: {
      type: String,
      required: [true, "Flat type is required"],
      trim: true,
      enum: ["1RK", "1BHK", "2BHK", "3BHK", "4BHK", "5BHK"]
    },
    invitedEmails: [
      {
        type: String,
        trim: true,
        lowercase: true
      }
    ]
  },
  {
    timestamps: true
  }
);

flatSchema.index(
  {
    societyId: 1,
    flatNumber: 1
  },
  {
    unique: true
  }
);

const Flat = mongoose.model("Flat", flatSchema);

export default Flat;
