import mongoose from "mongoose";

const maintenanceRateSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true
    },

    flatType: {
      type: String,
      enum: ["1RK", "1BHK", "2BHK", "3BHK", "4BHK", "5BHK"],
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

maintenanceRateSchema.index(
  {
    societyId: 1,
    flatType: 1
  },
  {
    unique: true
  }
);

const MaintenanceRate = mongoose.model("MaintenanceRate", maintenanceRateSchema);

export default MaintenanceRate;
