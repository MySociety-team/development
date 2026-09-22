import MaintenanceBill from "../../models/MaintenanceBill.js";

// =====================================================
// AUTOMATIC OVERDUE CHECKER
// =====================================================
//
// Rules:
//
// Before due date:
// PENDING
//
// After due date:
// OVERDUE
// totalAmount = maintenanceAmount + lateFee
//
// PAID bills are never changed.
//
// The check runs immediately when the server starts
// and then once every hour.
// =====================================================

const markAutomaticOverdueBills = async () => {
  try {
    // ---------------------------------------------------
    // Start of today
    // ---------------------------------------------------
    //
    // A bill whose dueDate is yesterday or earlier
    // is overdue.
    //
    // This means the complete due date has passed.
    // ---------------------------------------------------

    const startOfToday = new Date();

    startOfToday.setHours(0, 0, 0, 0);

    // ---------------------------------------------------
    // Find all pending bills whose due date has passed
    // ---------------------------------------------------

    const bills = await MaintenanceBill.find({
      status: "PENDING",

      dueDate: {
        $lt: startOfToday
      }
    })
      .select("_id societyId maintenanceAmount lateFee")
      .lean();

    if (!bills.length) {
      console.log("Maintenance overdue checker: no bills to update");

      return {
        updated: 0
      };
    }

    // ---------------------------------------------------
    // Update each bill
    // ---------------------------------------------------

    let updatedCount = 0;

    for (const bill of bills) {
      const maintenanceAmount = Number(bill.maintenanceAmount || 0);

      const lateFee = Number(bill.lateFee || 0);

      const totalAmount = maintenanceAmount + lateFee;

      const result = await MaintenanceBill.updateOne(
        {
          _id: bill._id,

          societyId: bill.societyId,

          // Extra protection:
          // only update if it is still pending.
          status: "PENDING"
        },

        {
          $set: {
            status: "OVERDUE",

            totalAmount
          }
        }
      );

      if (result.modifiedCount > 0) {
        updatedCount += 1;
      }
    }

    console.log(`Maintenance overdue checker: ${updatedCount} bill(s) marked overdue`);

    return {
      updated: updatedCount
    };
  } catch (error) {
    console.error("Maintenance overdue checker error:", error.message);

    return {
      updated: 0
    };
  }
};

// =====================================================
// START SCHEDULER
// =====================================================

const startMaintenanceScheduler = () => {
  // ---------------------------------------------------
  // Run once immediately
  // ---------------------------------------------------

  markAutomaticOverdueBills();

  // ---------------------------------------------------
  // Run every hour
  // ---------------------------------------------------

  const interval = setInterval(markAutomaticOverdueBills, 60 * 60 * 1000);

  // ---------------------------------------------------
  // Do not keep Node process alive only because
  // of this interval during shutdown.
  // ---------------------------------------------------

  if (typeof interval.unref === "function") {
    interval.unref();
  }

  console.log("Maintenance scheduler started. Overdue bills are checked every hour.");

  return interval;
};

export { markAutomaticOverdueBills, startMaintenanceScheduler };
