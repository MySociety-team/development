import SpecialCollection from "../../models/SpecialCollection.js";
import SpecialCollectionPayment from "../../models/SpecialCollectionPayment.js";
import SocietyMember from "../../models/SocietyMember.js";

const createCollection = async (data) => {
  return SpecialCollection.create(data);
};

const findCollectionById = async (societyId, collectionId) => {
  return SpecialCollection.findOne({
    _id: collectionId,
    societyId
  })
    .populate("createdBy", "name email")
    .populate("applicableFlatIds", "flatNumber floor wing")
    .populate("applicableResidentIds", "userId flatId role memberType")
    .lean();
};

const findCollectionsBySociety = async (societyId, filters = {}) => {
  const query = {
    societyId
  };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  return SpecialCollection.find(query)
    .populate("createdBy", "name email")
    .sort({
      createdAt: -1
    })
    .lean();
};

const updateCollection = async (societyId, collectionId, updates) => {
  return SpecialCollection.findOneAndUpdate(
    {
      _id: collectionId,
      societyId
    },
    {
      $set: updates
    },
    {
      new: true,
      runValidators: true
    }
  )
    .populate("createdBy", "name email")
    .lean();
};

const updateCollectionStatus = async (societyId, collectionId, status) => {
  return SpecialCollection.findOneAndUpdate(
    {
      _id: collectionId,
      societyId
    },
    {
      $set: {
        status
      }
    },
    {
      new: true,
      runValidators: true
    }
  ).lean();
};

const findActiveMembersBySociety = async (societyId) => {
  return SocietyMember.find({
    societyId,
    status: "ACTIVE"
  })
    .populate("userId", "name email")
    .populate("flatId", "flatNumber floor wing")
    .lean();
};

const createPayment = async (data) => {
  return SpecialCollectionPayment.create(data);
};

const findPaymentById = async (societyId, paymentId) => {
  return SpecialCollectionPayment.findOne({
    _id: paymentId,
    societyId
  })
    .populate("collectionId")
    .populate("flatId", "flatNumber floor wing")
    .populate({
      path: "residentId",
      select: "userId flatId role memberType",
      populate: {
        path: "userId",
        select: "name email"
      }
    })
    .lean();
};

/*
 * IMPORTANT
 *
 * This function must continue working even when
 * the Special Collection is CLOSED.
 *
 * A successful payment belongs to the resident and
 * collection permanently. Closing the collection
 * must NOT hide the payment or receipt.
 */
const findPaymentByCollectionAndResident = async (societyId, collectionId, residentId) => {
  return SpecialCollectionPayment.findOne({
    societyId,
    collectionId,
    residentId,
    status: "SUCCESS"
  })
    .populate("flatId", "flatNumber floor wing")
    .populate({
      path: "residentId",
      select: "userId flatId role memberType",
      populate: {
        path: "userId",
        select: "name email"
      }
    })
    .sort({
      paymentDate: -1,
      createdAt: -1
    })
    .lean();
};

const findPaymentsByCollection = async (societyId, collectionId) => {
  return SpecialCollectionPayment.find({
    societyId,
    collectionId
  })
    .populate("flatId", "flatNumber floor wing")
    .populate({
      path: "residentId",
      select: "userId flatId role memberType",
      populate: {
        path: "userId",
        select: "name email"
      }
    })
    .sort({
      paymentDate: -1,
      createdAt: -1
    })
    .lean();
};

const findPaymentsByResident = async (societyId, residentId) => {
  return SpecialCollectionPayment.find({
    societyId,
    residentId
  })
    .populate("collectionId")
    .populate("flatId", "flatNumber floor wing")
    .sort({
      paymentDate: -1,
      createdAt: -1
    })
    .lean();
};

const findPaymentsByFlat = async (societyId, flatId) => {
  return SpecialCollectionPayment.find({
    societyId,
    flatId
  })
    .populate("collectionId")
    .populate("flatId", "flatNumber floor wing")
    .sort({
      paymentDate: -1,
      createdAt: -1
    })
    .lean();
};

const findPendingRazorpayPayment = async (societyId, collectionId, residentId) => {
  return SpecialCollectionPayment.findOne({
    societyId,
    collectionId,
    residentId,
    paymentMethod: "RAZORPAY",
    status: "PENDING",
    razorpayOrderId: {
      $exists: true,
      $ne: null
    }
  })
    .sort({
      createdAt: -1
    })
    .lean();
};

const findPaymentByRazorpayOrderId = async (societyId, razorpayOrderId) => {
  return SpecialCollectionPayment.findOne({
    societyId,
    razorpayOrderId
  }).lean();
};

const updatePayment = async (societyId, paymentId, updates) => {
  return SpecialCollectionPayment.findOneAndUpdate(
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
};

const getCollectionPaymentsSummary = async (societyId, collectionId) => {
  const payments = await SpecialCollectionPayment.find({
    societyId,
    collectionId,
    status: "SUCCESS"
  })
    .select("amount refundStatus refundAmount")
    .lean();

  let collectedAmount = 0;
  let paidCount = 0;
  let refundedAmount = 0;
  let refundedCount = 0;

  for (const payment of payments) {
    const amount = Number(payment.amount || 0);

    const refundAmount = Number(payment.refundAmount || 0);

    if (payment.refundStatus === "REFUNDED") {
      refundedCount += 1;
      refundedAmount += refundAmount;
      continue;
    }

    paidCount += 1;
    collectedAmount += amount;
  }

  return {
    paidCount,
    collectedAmount,
    refundedCount,
    refundedAmount
  };
};

export {
  createCollection,
  findCollectionById,
  findCollectionsBySociety,
  updateCollection,
  updateCollectionStatus,
  findActiveMembersBySociety,
  createPayment,
  findPaymentById,
  findPaymentByCollectionAndResident,
  findPaymentsByCollection,
  findPaymentsByResident,
  findPaymentsByFlat,
  findPendingRazorpayPayment,
  findPaymentByRazorpayOrderId,
  updatePayment,
  getCollectionPaymentsSummary
};
