import {
  createSpecialCollection,
  getSpecialCollections,
  getSpecialCollection,
  updateSpecialCollection,
  activateSpecialCollection,
  closeSpecialCollection,
  cancelSpecialCollection,
  getResidentCollectionStatus,
  recordOfflinePayment,
  refundSpecialCollectionPayment,
  createSpecialCollectionPaymentOrder,
  verifySpecialCollectionPayment,
  getMySpecialCollectionPayments,
  getFlatSpecialCollectionPayments,
  getSpecialCollectionPayments,
  getSpecialCollectionSummary,
  getSpecialCollectionPayment,
  sendSpecialCollectionReminder,
  getSpecialCollectionReport,
  getSpecialCollectionSelectionOptions
} from "./specialCollection.service.js";

// =====================================================
// CREATE COLLECTION
// =====================================================

const createSpecialCollectionController = async (req, res, next) => {
  try {
    const collection = await createSpecialCollection({
      societyId: req.params.societyId,
      userId: req.user.id,
      role: req.societyMember.role,
      data: req.body
    });

    res.status(201).json({
      success: true,
      message: "Special collection created successfully",
      data: collection
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET COLLECTIONS
// =====================================================

const getSpecialCollectionsController = async (req, res, next) => {
  try {
    const collections = await getSpecialCollections({
      societyId: req.params.societyId,
      role: req.societyMember.role,
      flatId: req.societyMember.flatId,
      residentId: req.societyMember._id,
      status: req.query.status,
      category: req.query.category
    });

    res.status(200).json({
      success: true,
      data: collections
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET ONE COLLECTION
// =====================================================

const getSpecialCollectionController = async (req, res, next) => {
  try {
    const collection = await getSpecialCollection({
      societyId: req.params.societyId,
      collectionId: req.params.collectionId,
      role: req.societyMember.role,
      flatId: req.societyMember.flatId,
      residentId: req.societyMember._id
    });

    res.status(200).json({
      success: true,
      data: collection
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET SELECTION OPTIONS
// =====================================================

const getSpecialCollectionSelectionOptionsController = async (req, res, next) => {
  try {
    const options = await getSpecialCollectionSelectionOptions({
      societyId: req.params.societyId,
      role: req.societyMember.role
    });

    res.status(200).json({
      success: true,
      data: options
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE COLLECTION
// =====================================================

const updateSpecialCollectionController = async (req, res, next) => {
  try {
    const collection = await updateSpecialCollection({
      societyId: req.params.societyId,
      collectionId: req.params.collectionId,
      role: req.societyMember.role,
      data: req.body
    });

    res.status(200).json({
      success: true,
      message: "Special collection updated successfully",
      data: collection
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ACTIVATE COLLECTION
// =====================================================

const activateSpecialCollectionController = async (req, res, next) => {
  try {
    const collection = await activateSpecialCollection({
      societyId: req.params.societyId,
      collectionId: req.params.collectionId,
      role: req.societyMember.role
    });

    res.status(200).json({
      success: true,
      message: "Special collection activated successfully",
      data: collection
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CLOSE COLLECTION
// =====================================================

const closeSpecialCollectionController = async (req, res, next) => {
  try {
    const collection = await closeSpecialCollection({
      societyId: req.params.societyId,
      collectionId: req.params.collectionId,
      role: req.societyMember.role
    });

    res.status(200).json({
      success: true,
      message: "Special collection closed successfully",
      data: collection
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CANCEL COLLECTION
// =====================================================

const cancelSpecialCollectionController = async (req, res, next) => {
  try {
    const collection = await cancelSpecialCollection({
      societyId: req.params.societyId,
      collectionId: req.params.collectionId,
      role: req.societyMember.role
    });

    res.status(200).json({
      success: true,
      message: "Special collection cancelled successfully",
      data: collection
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET RESIDENT COLLECTION STATUS
// =====================================================

const getResidentCollectionStatusController = async (req, res, next) => {
  try {
    const result = await getResidentCollectionStatus({
      societyId: req.params.societyId,
      collectionId: req.params.collectionId,
      flatId: req.societyMember.flatId,
      residentId: req.societyMember._id,
      role: req.societyMember.role
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// RECORD OFFLINE PAYMENT
// =====================================================

const recordOfflinePaymentController = async (req, res, next) => {
  try {
    const payment = await recordOfflinePayment({
      societyId: req.params.societyId,
      userId: req.user.id,
      role: req.societyMember.role,
      data: req.body
    });

    res.status(201).json({
      success: true,
      message: "Offline payment recorded successfully",
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// REFUND / ADJUST PAYMENT
// =====================================================

const refundSpecialCollectionPaymentController = async (req, res, next) => {
  try {
    const payment = await refundSpecialCollectionPayment({
      societyId: req.params.societyId,
      userId: req.user.id,
      role: req.societyMember.role,
      paymentId: req.params.paymentId,
      data: req.body
    });

    res.status(200).json({
      success: true,
      message: "Payment refunded successfully",
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

const createSpecialCollectionPaymentOrderController = async (req, res, next) => {
  try {
    const result = await createSpecialCollectionPaymentOrder({
      societyId: req.params.societyId,
      userId: req.user.id,
      role: req.societyMember.role,
      flatId: req.societyMember.flatId,
      residentId: req.societyMember._id,
      data: req.body
    });

    res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================

const verifySpecialCollectionPaymentController = async (req, res, next) => {
  try {
    const payment = await verifySpecialCollectionPayment({
      societyId: req.params.societyId,
      userId: req.user.id,
      role: req.societyMember.role,
      flatId: req.societyMember.flatId,
      residentId: req.societyMember._id,
      data: req.body
    });

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET MY PAYMENTS
// =====================================================

const getMySpecialCollectionPaymentsController = async (req, res, next) => {
  try {
    const payments = await getMySpecialCollectionPayments({
      societyId: req.params.societyId,
      residentId: req.societyMember._id
    });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET FLAT PAYMENTS
// =====================================================

const getFlatSpecialCollectionPaymentsController = async (req, res, next) => {
  try {
    const payments = await getFlatSpecialCollectionPayments({
      societyId: req.params.societyId,
      flatId: req.params.flatId,
      role: req.societyMember.role
    });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET COLLECTION PAYMENTS
// =====================================================

const getSpecialCollectionPaymentsController = async (req, res, next) => {
  try {
    const payments = await getSpecialCollectionPayments({
      societyId: req.params.societyId,
      collectionId: req.params.collectionId,
      role: req.societyMember.role
    });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET COLLECTION SUMMARY
// =====================================================

const getSpecialCollectionSummaryController = async (req, res, next) => {
  try {
    const summary = await getSpecialCollectionSummary({
      societyId: req.params.societyId,
      collectionId: req.params.collectionId,
      role: req.societyMember.role
    });

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET SPECIAL COLLECTION REPORT
// =====================================================

const getSpecialCollectionReportController = async (req, res, next) => {
  try {
    const report = await getSpecialCollectionReport({
      societyId: req.params.societyId,
      collectionId: req.params.collectionId,
      role: req.societyMember.role
    });

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET SINGLE PAYMENT
// =====================================================

const getSpecialCollectionPaymentController = async (req, res, next) => {
  try {
    const payment = await getSpecialCollectionPayment({
      societyId: req.params.societyId,
      paymentId: req.params.paymentId,
      role: req.societyMember.role,
      residentId: req.societyMember._id
    });

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SEND MANUAL REMINDER
// =====================================================

const sendSpecialCollectionReminderController = async (req, res, next) => {
  try {
    const result = await sendSpecialCollectionReminder({
      societyId: req.params.societyId,
      collectionId: req.params.collectionId,
      userId: req.user.id,
      role: req.societyMember.role,
      message: req.body.message
    });

    res.status(201).json({
      success: true,
      message: "Special collection reminder sent successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// EXPORT CONTROLLERS
// =====================================================

export {
  createSpecialCollectionController,
  getSpecialCollectionsController,
  getSpecialCollectionController,
  getSpecialCollectionSelectionOptionsController,
  updateSpecialCollectionController,
  activateSpecialCollectionController,
  closeSpecialCollectionController,
  cancelSpecialCollectionController,
  getResidentCollectionStatusController,
  recordOfflinePaymentController,
  refundSpecialCollectionPaymentController,
  createSpecialCollectionPaymentOrderController,
  verifySpecialCollectionPaymentController,
  getMySpecialCollectionPaymentsController,
  getFlatSpecialCollectionPaymentsController,
  getSpecialCollectionPaymentsController,
  getSpecialCollectionSummaryController,
  getSpecialCollectionReportController,
  getSpecialCollectionPaymentController,
  sendSpecialCollectionReminderController
};
