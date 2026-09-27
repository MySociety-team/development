import mongoose from "mongoose";

const { Schema } = mongoose;

const specialCollectionSchema = new Schema(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: [true, "Society ID is required"],
      index: true
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"]
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: ""
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["Event", "Repair", "Emergency Fund", "Building Work", "Other"],
        message: "Invalid collection category"
      }
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"]
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"]
    },

    dueDate: {
      type: Date,
      required: [true, "Due date is required"]
    },

    paymentInstructions: {
      type: String,
      trim: true,
      maxlength: [1000, "Payment instructions cannot exceed 1000 characters"],
      default: ""
    },

    imageUrl: {
      type: String,
      trim: true,
      default: null
    },

    documentUrl: {
      type: String,
      trim: true,
      default: null
    },

    audienceType: {
      type: String,
      required: [true, "Audience type is required"],
      enum: {
        values: ["ALL_FLATS", "SELECTED_FLATS", "SELECTED_RESIDENTS"],
        message: "Invalid audience type"
      }
    },

    applicableFlatIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Flat"
      }
    ],

    applicableResidentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "SocietyMember"
      }
    ],

    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "CLOSED", "CANCELLED"],
      default: "DRAFT",
      index: true
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"]
    }
  },
  {
    timestamps: true
  }
);

specialCollectionSchema.index({
  societyId: 1,
  status: 1
});

specialCollectionSchema.index({
  societyId: 1,
  dueDate: 1
});

const SpecialCollection = mongoose.model("SpecialCollection", specialCollectionSchema);

export default SpecialCollection;
