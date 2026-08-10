import mongoose from "mongoose";

const { Schema } = mongoose;

const societySchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Name is Required"]
    },

    address: {
      type: String,
      trim: true,
      required: [true, "Address is Required"]
    },

    joiningCode: {
      type: String,
      trim: true,
      required: [true, "Joining code is Required"],
      unique: true,
      uppercase: true
    },
    secretary: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Secretary is Required"]
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created By is Required"]
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      default: null
    },
    numberOfFlats: {
      type: Number,
      required: [true, "Number Of Flats is required"],
      min: [1, "Number of Flats must be Greater than 0"]
    },
    facilities: [
      {
        type: String,
        trim: true,
        validate: {
          validator: (value) => value.trim().length > 0,
          message: "Facility name cannot be Empty "
        }
      }
    ],

    isActive: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Society = mongoose.model("Society", societySchema);
export default Society;
