import asyncHandler from "../../utils/asyncHandler.js";

import {
  createMaintenanceBill,
  generateMonthlyBills,

  getMaintenanceBill,
  getCurrentMaintenanceBill,
  getMaintenanceHistory,
  getSocietyBills,

  updateMaintenanceBill,
  markOverdueBills,

  recordOfflinePayment,

  getPaymentHistory,
  getSocietyPaymentHistory,
  getPayment,

  getMaintenanceDashboard,
  getMaintenanceTransparency,

  createMaintenancePaymentOrder,
  verifyMaintenancePayment
} from "./maintenance.service.js";


// =====================================================
// BILL CONTROLLERS
// =====================================================

const createBill = asyncHandler(
  async (req, res) => {

    const {
      flatId,
      month,
      maintenanceAmount,
      dueDate,
      lateFee,
      adjustmentReason
    } = req.body;

    const bill =
      await createMaintenanceBill({

        societyId:
          req.params.societyId,

        userId:
          req.user.id,

        flatId,

        month,

        maintenanceAmount,

        dueDate,

        lateFee,

        adjustmentReason
      });

    res.status(201).json({

      success: true,

      message:
        "Maintenance bill created successfully",

      data: bill
    });
  }
);


// =====================================================
// GENERATE MONTHLY BILLS
// =====================================================

const generateBills = asyncHandler(
  async (req, res) => {

    const {
      month,
      dueDate,
      defaultMaintenanceAmount,
      lateFee
    } = req.body;

    const bills =
      await generateMonthlyBills({

        societyId:
          req.params.societyId,

        userId:
          req.user.id,

        month,

        dueDate,

        defaultMaintenanceAmount,

        lateFee
      });

    res.status(201).json({

      success: true,

      message:
        "Monthly maintenance bills generated successfully",

      data: bills
    });
  }
);


// =====================================================
// GET BILL
// =====================================================

const getBill = asyncHandler(
  async (req, res) => {

    const bill =
      await getMaintenanceBill({

        societyId:
          req.params.societyId,

        billId:
          req.params.billId,

        flatId:
          req.societyMember.flatId,

        role:
          req.societyMember.role
      });

    res.status(200).json({

      success: true,

      data: bill
    });
  }
);


// =====================================================
// CURRENT BILL
// =====================================================

const getCurrentBill = asyncHandler(
  async (req, res) => {

    const bill =
      await getCurrentMaintenanceBill({

        societyId:
          req.params.societyId,

        flatId:
          req.societyMember.flatId
      });

    res.status(200).json({

      success: true,

      data: bill
    });
  }
);


// =====================================================
// BILL HISTORY
// =====================================================

const getHistory = asyncHandler(
  async (req, res) => {

    const bills =
      await getMaintenanceHistory({

        societyId:
          req.params.societyId,

        flatId:
          req.societyMember.flatId
      });

    res.status(200).json({

      success: true,

      data: bills
    });
  }
);


// =====================================================
// SOCIETY BILLS
// =====================================================

const getBillsByMonth = asyncHandler(
  async (req, res) => {

    const bills =
      await getSocietyBills({

        societyId:
          req.params.societyId,

        month:
          req.query.month
      });

    res.status(200).json({

      success: true,

      data: bills
    });
  }
);


// =====================================================
// UPDATE BILL
// =====================================================

const updateBill = asyncHandler(
  async (req, res) => {

    const {
      maintenanceAmount,
      dueDate,
      lateFee,
      adjustmentReason
    } = req.body;

    const bill =
      await updateMaintenanceBill({

        societyId:
          req.params.societyId,

        billId:
          req.params.billId,

        maintenanceAmount,

        dueDate,

        lateFee,

        adjustmentReason
      });

    res.status(200).json({

      success: true,

      message:
        "Maintenance bill updated successfully",

      data: bill
    });
  }
);


// =====================================================
// MARK OVERDUE
// =====================================================

const markOverdue = asyncHandler(
  async (req, res) => {

    const result =
      await markOverdueBills({

        societyId:
          req.params.societyId,

        month:
          req.body.month
      });

    let message;

    if (
      result.updatedCount === 0
    ) {

      message =
        `No bills were marked overdue for ${result.month}.`;

    } else if (
      result.updatedCount === 1
    ) {

      message =
        `1 bill was marked overdue for ${result.month}.`;

    } else {

      message =
        `${result.updatedCount} bills were marked overdue for ${result.month}.`;
    }

    res.status(200).json({

      success: true,

      message,

      data: result
    });
  }
);


// =====================================================
// PAYMENT CONTROLLERS
// =====================================================


// =====================================================
// RECORD OFFLINE PAYMENT
// =====================================================

const recordOffline = asyncHandler(
  async (req, res) => {

    const {
      billId,
      amount,
      paymentMethod,
      paymentDate,
      transactionId
    } = req.body;

    const payment =
      await recordOfflinePayment({

        societyId:
          req.params.societyId,

        billId,

        amount,

        paymentMethod,

        paymentDate,

        transactionId
      });

    res.status(201).json({

      success: true,

      message:
        "Offline payment recorded successfully",

      data: payment
    });
  }
);


// =====================================================
// MY PAYMENT HISTORY
// =====================================================

const getMyPaymentHistory =
  asyncHandler(
    async (req, res) => {

      const payments =
        await getPaymentHistory({

          societyId:
            req.params.societyId,

          flatId:
            req.societyMember.flatId
        });

      res.status(200).json({

        success: true,

        data: payments
      });
    }
  );


// =====================================================
// SOCIETY PAYMENT HISTORY
// =====================================================

const getSocietyPayments =
  asyncHandler(
    async (req, res) => {

      const payments =
        await getSocietyPaymentHistory({

          societyId:
            req.params.societyId,

          month:
            req.query.month
        });

      res.status(200).json({

        success: true,

        data: payments
      });
    }
  );


// =====================================================
// GET PAYMENT DETAILS
// =====================================================

const getPaymentDetails =
  asyncHandler(
    async (req, res) => {

      const payment =
        await getPayment({

          societyId:
            req.params.societyId,

          paymentId:
            req.params.paymentId,

          flatId:
            req.societyMember.flatId,

          role:
            req.societyMember.role
        });

      res.status(200).json({

        success: true,

        data: payment
      });
    }
  );


// =====================================================
// DASHBOARD
// =====================================================

const getDashboard =
  asyncHandler(
    async (req, res) => {

      const stats =
        await getMaintenanceDashboard({

          societyId:
            req.params.societyId,

          month:
            req.query.month
        });

      res.status(200).json({

        success: true,

        data: stats
      });
    }
  );


// =====================================================
// TRANSPARENCY
// =====================================================
//
// Any active society member can view:
//
// - All flat numbers
// - Bill amount
// - Payment status
// - Payment date
//
// Private information is NOT returned.
//
// Possible status:
//
// - PAID
// - PENDING
// - OVERDUE
// - NO_BILL
// =====================================================

const getTransparency =
  asyncHandler(
    async (req, res) => {

      const stats =
        await getMaintenanceTransparency({

          societyId:
            req.params.societyId,

          month:
            req.query.month
        });

      res.status(200).json({

        success: true,

        data: stats
      });
    }
  );


// =====================================================
// RAZORPAY - CREATE ORDER
// =====================================================

const createPaymentOrder =
  asyncHandler(
    async (req, res) => {

      const result =
        await createMaintenancePaymentOrder({

          societyId:
            req.params.societyId,

          billId:
            req.body.billId,

          flatId:
            req.societyMember.flatId,

          role:
            req.societyMember.role,

          // FIX:
          // Pass logged-in user's ID to the service
          userId:
            req.user.id
        });

      res.status(201).json({

        success: true,

        message:
          "Maintenance payment order created successfully",

        data: result
      });
    }
  );


// =====================================================
// RAZORPAY - VERIFY PAYMENT
// =====================================================

const verifyPayment =
  asyncHandler(
    async (req, res) => {

      const payment =
        await verifyMaintenancePayment({

          societyId:
            req.params.societyId,

          billId:
            req.body.billId,

          flatId:
            req.societyMember.flatId,

          role:
            req.societyMember.role,

          razorpay_order_id:
            req.body.razorpay_order_id,

          razorpay_payment_id:
            req.body.razorpay_payment_id,

          razorpay_signature:
            req.body.razorpay_signature
        });

      res.status(200).json({

        success: true,

        message:
          "Maintenance payment verified successfully",

        data: payment
      });
    }
  );


// =====================================================
// EXPORTS
// =====================================================

export {
  createBill,
  generateBills,

  getBill,
  getCurrentBill,
  getHistory,
  getBillsByMonth,

  updateBill,
  markOverdue,

  recordOffline,

  getMyPaymentHistory,
  getSocietyPayments,
  getPaymentDetails,

  getDashboard,
  getTransparency,

  createPaymentOrder,
  verifyPayment
};