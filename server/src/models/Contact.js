import mongoose from "mongoose";

const { Schema } = mongoose;

const contactSchema = new Schema(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: [true, "Society ID is Required"]
    },

    name: {
      type: String,
      required: [true, "Name is Required"],
      trim: true
    },

    profession: {
      type: String,
      required: [true, "Profession is Required"],
      trim: true
    },

    address: {
      type: String,
      required: [true, "Address is Required"],
      trim: true
    },

    mobileNumber: {
      type: String,
      required: [true, "Mobile Number is Required"],
      trim: true
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },

    charges: {
      type: String,
      required: [true, "Charges is Required"],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

contactSchema.index({
  societyId: 1,
  profession: 1
});

contactSchema.index({
  societyId: 1,
  name: 1
});

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;
