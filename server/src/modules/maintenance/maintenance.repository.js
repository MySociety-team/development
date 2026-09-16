import MaintenanceBill from "../../models/MaintenanceBill.js";
import MaintenancePayment from "../../models/MaintenancePayment.js";
import Flat from "../../models/Flat.js";


// =====================================================
// CREATE BILL
// =====================================================

const createBill = async (data) => {

  const bill =
    await MaintenanceBill.create(data);

  return bill;
};


// =====================================================
// CREATE MULTIPLE BILLS
// =====================================================

const createBills = async (bills) => {

  if (!bills.length) {
    return [];
  }

  const createdBills =
    await MaintenanceBill.insertMany(
      bills
    );

  return createdBills;
};


// =====================================================
// FIND BILL BY ID
// =====================================================

const findBillById = async (
  societyId,
  billId
) => {

  const bill =
    await MaintenanceBill.findOne({
      _id: billId,
      societyId
    }).lean();

  return bill;
};


// =====================================================
// FIND BILL BY ID WITH DETAILS
// =====================================================

const findBillByIdWithDetails = async (
  societyId,
  billId
) => {

  const bill =
    await MaintenanceBill.findOne({
      _id: billId,
      societyId
    })
      .populate(
        "flatId",
        "flatNumber floor wing"
      )
      .lean();

  return bill;
};


// =====================================================
// FIND BILL BY FLAT AND MONTH
// =====================================================

const findBillByFlatAndMonth = async (
  societyId,
  flatId,
  month
) => {

  const bill =
    await MaintenanceBill.findOne({
      societyId,
      flatId,
      month
    }).lean();

  return bill;
};


// =====================================================
// FIND SOCIETY BILLS BY MONTH
// =====================================================

const findBillsBySocietyAndMonth = async (
  societyId,
  month
) => {

  const bills =
    await MaintenanceBill.find({
      societyId,
      month
    })
      .populate(
        "flatId",
        "flatNumber floor wing"
      )
      .sort({
        createdAt: 1
      })
      .lean();

  return bills;
};


// =====================================================
// FIND CURRENT BILL
// =====================================================

const findCurrentBill = async (
  societyId,
  flatId
) => {

  const bill =
    await MaintenanceBill.findOne({
      societyId,
      flatId
    })
      .sort({
        month: -1
      })
      .lean();

  return bill;
};


// =====================================================
// FIND BILLS BY FLAT
// =====================================================

const findBillsByFlat = async (
  societyId,
  flatId
) => {

  const bills =
    await MaintenanceBill.find({
      societyId,
      flatId
    })
      .sort({
        month: -1
      })
      .lean();

  return bills;
};


// =====================================================
// UPDATE BILL
// =====================================================

const updateBill = async (
  societyId,
  billId,
  updates
) => {

  const bill =
    await MaintenanceBill.findOneAndUpdate(
      {
        _id: billId,
        societyId
      },
      {
        $set: updates
      },
      {
        new: true,
        runValidators: true
      }
    ).lean();

  return bill;
};


// =====================================================
// UPDATE BILL STATUS
// =====================================================

const updateBillStatus = async (
  societyId,
  billId,
  status,
  totalAmount
) => {

  const updateData = {
    status
  };

  if (
    typeof totalAmount === "number"
  ) {
    updateData.totalAmount =
      totalAmount;
  }

  const bill =
    await MaintenanceBill.findOneAndUpdate(
      {
        _id: billId,
        societyId
      },
      {
        $set: updateData
      },
      {
        new: true,
        runValidators: true
      }
    ).lean();

  return bill;
};


// =====================================================
// CREATE PAYMENT
// =====================================================

const createPayment = async (
  data
) => {

  const payment =
    await MaintenancePayment.create(
      data
    );

  return payment;
};


// =====================================================
// FIND PAYMENT BY ID
// =====================================================

const findPaymentById = async (
  societyId,
  paymentId
) => {

  const payment =
    await MaintenancePayment.findOne({
      _id: paymentId,
      societyId
    })
      .populate(
        "billId"
      )
      .populate(
        "flatId",
        "flatNumber floor wing"
      )
      .lean();

  return payment;
};


// =====================================================
// FIND PAYMENT BY BILL ID
// =====================================================

const findPaymentByBillId = async (
  societyId,
  billId
) => {

  const payment =
    await MaintenancePayment.findOne({
      societyId,
      billId
    })
      .sort({
        createdAt: -1
      })
      .lean();

  return payment;
};


// =====================================================
// FIND PAYMENT BY RAZORPAY ORDER ID
// =====================================================

const findPaymentByRazorpayOrderId = async (
  societyId,
  razorpayOrderId
) => {

  const payment =
    await MaintenancePayment.findOne({
      societyId,
      razorpayOrderId
    }).lean();

  return payment;
};


// =====================================================
// FIND PAYMENTS BY FLAT
// =====================================================

const findPaymentsByFlat = async (
  societyId,
  flatId
) => {

  const payments =
    await MaintenancePayment.find({
      societyId,
      flatId
    })
      .populate(
        "billId"
      )
      .populate(
        "flatId",
        "flatNumber floor wing"
      )
      .sort({
        paymentDate: -1
      })
      .lean();

  return payments;
};


// =====================================================
// FIND PAYMENTS BY SOCIETY
// =====================================================

const findPaymentsBySociety = async (
  societyId,
  month
) => {

  let billIds = null;

  if (month) {

    const bills =
      await MaintenanceBill.find({
        societyId,
        month
      })
        .select("_id")
        .lean();

    billIds =
      bills.map(
        (bill) => bill._id
      );
  }

  const query = {
    societyId
  };

  if (billIds) {
    query.billId = {
      $in: billIds
    };
  }

  const payments =
    await MaintenancePayment.find(
      query
    )
      .populate(
        "flatId",
        "flatNumber floor wing"
      )
      .populate(
        "billId"
      )
      .sort({
        paymentDate: -1
      })
      .lean();

  return payments;
};


// =====================================================
// UPDATE PAYMENT
// =====================================================

const updatePayment = async (
  societyId,
  paymentId,
  updates
) => {

  const payment =
    await MaintenancePayment.findOneAndUpdate(
      {
        _id: paymentId,
        societyId
      },
      {
        $set: updates
      },
      {
        new: true,
        runValidators: true
      }
    ).lean();

  return payment;
};


// =====================================================
// DASHBOARD STATISTICS
// =====================================================

const getDashboardStats = async (
  societyId,
  month
) => {

  const bills =
    await MaintenanceBill.find({
      societyId,
      month
    })
      .select(
        "maintenanceAmount totalAmount status"
      )
      .lean();

  const stats = {

    totalBills:
      bills.length,

    expectedAmount:
      0,

    collectedAmount:
      0,

    pendingAmount:
      0,

    overdueAmount:
      0,

    paidCount:
      0,

    pendingCount:
      0,

    overdueCount:
      0
  };


  for (const bill of bills) {

    const amount =
      Number(
        bill.totalAmount || 0
      );


    stats.expectedAmount +=
      amount;


    if (
      bill.status === "PAID"
    ) {

      stats.collectedAmount +=
        amount;

      stats.paidCount += 1;

    } else if (
      bill.status === "OVERDUE"
    ) {

      stats.overdueAmount +=
        amount;

      stats.overdueCount += 1;

    } else {

      stats.pendingAmount +=
        amount;

      stats.pendingCount += 1;
    }
  }


  return stats;
};


// =====================================================
// SOCIETY TRANSPARENCY
// =====================================================
//
// Returns ALL flats in the society for the selected month.
//
// Public/resident-safe information only:
// - flat number
// - bill amount
// - bill status
// - payment date
//
// It does NOT return:
// - resident name
// - email
// - mobile number
// - transaction ID
// - Razorpay payment ID
// - UPI/bank details
//
// Status can be:
// - PAID
// - PENDING
// - OVERDUE
// - NO_BILL
// =====================================================

const getTransparencyStats = async (
  societyId,
  month
) => {

  // ---------------------------------------------------
  // Get ALL flats in the society
  // ---------------------------------------------------

  const flats =
    await Flat.find({
      societyId
    })
      .select(
        "_id flatNumber floor wing"
      )
      .sort({
        flatNumber: 1
      })
      .lean();


  // ---------------------------------------------------
  // Get all bills for selected month
  // ---------------------------------------------------

  const bills =
    await MaintenanceBill.find({
      societyId,
      month
    })
      .select(
        "_id flatId maintenanceAmount totalAmount status dueDate"
      )
      .lean();


  // ---------------------------------------------------
  // Get successful payments for those bills
  // ---------------------------------------------------

  const billIds =
    bills.map(
      (bill) => bill._id
    );


  let payments = [];


  if (billIds.length > 0) {

    payments =
      await MaintenancePayment.find({
        societyId,

        billId: {
          $in: billIds
        },

        status: "SUCCESS"
      })
        .select(
          "billId paymentDate"
        )
        .sort({
          paymentDate: -1
        })
        .lean();
  }


  // ---------------------------------------------------
  // Create quick lookup for bills
  // ---------------------------------------------------

  const billMap =
    new Map();


  for (const bill of bills) {

    billMap.set(
      bill.flatId.toString(),
      bill
    );
  }


  // ---------------------------------------------------
  // Create quick lookup for payments
  // ---------------------------------------------------

  const paymentMap =
    new Map();


  for (const payment of payments) {

    const billId =
      payment.billId.toString();


    // Keep the latest successful
    // payment if there is more than one.
    if (
      !paymentMap.has(
        billId
      )
    ) {

      paymentMap.set(
        billId,
        payment
      );
    }
  }


  // ---------------------------------------------------
  // Build transparency response
  // ---------------------------------------------------

  const transparency =
    flats.map(
      (flat) => {

        const flatId =
          flat._id.toString();


        const bill =
          billMap.get(
            flatId
          );


        // ---------------------------------------------
        // Flat has NO bill for selected month
        // ---------------------------------------------

        if (!bill) {

          return {

            flatId:
              flat._id,

            flatNumber:
              flat.flatNumber,

            floor:
              flat.floor,

            wing:
              flat.wing,

            amount:
              null,

            status:
              "NO_BILL",

            paymentDate:
              null
          };
        }


        // ---------------------------------------------
        // Flat has a bill
        // ---------------------------------------------

        const payment =
          paymentMap.get(
            bill._id.toString()
          );


        return {

          flatId:
            flat._id,

          flatNumber:
            flat.flatNumber,

          floor:
            flat.floor,

          wing:
            flat.wing,

          amount:
            Number(
              bill.totalAmount || 0
            ),

          status:
            bill.status,

          paymentDate:
            payment
              ? payment.paymentDate
              : null
        };
      }
    );


  // ---------------------------------------------------
  // Return transparency data
  // ---------------------------------------------------

  return transparency;
};


// =====================================================
// EXPORTS
// =====================================================

export {

  createBill,

  createBills,

  findBillById,

  findBillByIdWithDetails,

  findBillByFlatAndMonth,

  findBillsBySocietyAndMonth,

  findCurrentBill,

  findBillsByFlat,

  updateBill,

  updateBillStatus,

  createPayment,

  findPaymentById,

  findPaymentByBillId,

  findPaymentByRazorpayOrderId,

  findPaymentsByFlat,

  findPaymentsBySociety,

  updatePayment,

  getDashboardStats,

  getTransparencyStats
};