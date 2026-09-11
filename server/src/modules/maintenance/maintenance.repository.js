import MaintenanceBill from "../../models/MaintenanceBill.js";
import MaintenancePayment from "../../models/MaintenancePayment.js";

const createBill = async (data) => {
  return MaintenanceBill.create(data);
};

const createBills = async (bills) => {
  return MaintenanceBill.insertMany(bills, {
    ordered: true
  });
};

const findBillById = async (billId) => {
  return MaintenanceBill.findById(billId);
};

const findBillByIdWithDetails = async (billId) => {
  return MaintenanceBill.findById(billId)
    .populate("flatId", "flatNumber floor wing")
    .populate("societyId", "name")
    .populate("createdBy", "name email");
};

const findBillByFlatAndMonth = async (societyId, flatId, month) => {
  return MaintenanceBill.findOne({
    societyId,
    flatId,
    month
  });
};

const findBillsBySocietyAndMonth = async (societyId, month) => {
  return MaintenanceBill.find({
    societyId,
    month
  })
    .populate("flatId", "flatNumber floor wing")
    .sort({ "flatId.flatNumber": 1 });
};

const findCurrentBill = async (societyId, flatId) => {
  return MaintenanceBill.findOne({
    societyId,
    flatId
  }).sort({ month: -1 });
};

const findBillsByFlat = async (societyId, flatId) => {
  return MaintenanceBill.find({
    societyId,
    flatId
  }).sort({ month: -1 });
};

const updateBill = async (billId, updates) => {
  return MaintenanceBill.findByIdAndUpdate(
    billId,
    {
      $set: updates
    },
    {
      new: true,
      runValidators: true
    }
  );
};

const updateBillStatus = async (billId, status) => {
  return MaintenanceBill.findByIdAndUpdate(
    billId,
    {
      $set: { status }
    },
    {
      new: true,
      runValidators: true
    }
  );
};

const createPayment = async (data) => {
  return MaintenancePayment.create(data);
};

const findPaymentById = async (paymentId) => {
  return MaintenancePayment.findById(paymentId);
};

const findPaymentByBillId = async (billId) => {
  return MaintenancePayment.findOne({
    billId
  }).sort({ createdAt: -1 });
};

const findPaymentsByFlat = async (societyId, flatId) => {
  return MaintenancePayment.find({
    societyId,
    flatId
  }).sort({ paymentDate: -1 });
};

const findPaymentsBySociety = async (societyId) => {
  return MaintenancePayment.find({
    societyId
  })
    .populate("flatId", "flatNumber floor wing")
    .populate("billId", "month maintenanceAmount lateFee totalAmount")
    .sort({ paymentDate: -1 });
};

const updatePayment = async (paymentId, updates) => {
  return MaintenancePayment.findByIdAndUpdate(
    paymentId,
    {
      $set: updates
    },
    {
      new: true,
      runValidators: true
    }
  );
};

const getDashboardStats = async (societyId, month) => {
  const bills = await MaintenanceBill.find({
    societyId,
    month
  }).lean();

  const stats = {
    totalFlats: bills.length,
    expectedAmount: 0,
    collectedAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0
  };

  for (const bill of bills) {
    stats.expectedAmount += bill.totalAmount || 0;

    if (bill.status === "PAID") {
      stats.collectedAmount += bill.totalAmount || 0;
      stats.paidCount += 1;
    } else if (bill.status === "OVERDUE") {
      stats.overdueAmount += bill.totalAmount || 0;
      stats.overdueCount += 1;
    } else {
      stats.pendingAmount += bill.totalAmount || 0;
      stats.pendingCount += 1;
    }
  }

  return stats;
};

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
  findPaymentsByFlat,
  findPaymentsBySociety,
  updatePayment,
  getDashboardStats
};
