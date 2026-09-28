import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { getSociety } from "../../societies/api/society.api.js";

import {
  createSpecialCollectionPaymentOrder,
  getSpecialCollection,
  getResidentCollectionStatus,
  verifySpecialCollectionPayment
} from "../api/specialCollection.api.js";

import { loadRazorpayCheckout } from "../../subscriptions/utils/loadRazorpay.js";

function formatAmount(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function formatDate(date) {
  if (!date) {
    return "No date";
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function SpecialCollectionPaymentPage() {
  const { societyId, collectionId } = useParams();

  const [collection, setCollection] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [membership, setMembership] = useState(null);

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const [showReceipt, setShowReceipt] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isSecretary = membership?.role === "SECRETARY";

  const loadPaymentData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [collectionData, statusData, societyData] = await Promise.all([
        getSpecialCollection(societyId, collectionId),
        getResidentCollectionStatus(societyId, collectionId),
        getSociety(societyId)
      ]);

      setCollection(collectionData);

      setPaymentStatus(statusData || null);

      setMembership(societyData?.membership || null);

      return {
        collection: collectionData,
        status: statusData || null,
        membership: societyData?.membership || null
      };
    } catch (error) {
      console.error("Special collection payment data error:", error);

      setErrorMessage(getApiErrorMessage(error, "Unable to load collection payment details."));

      return null;
    } finally {
      setLoading(false);
    }
  }, [societyId, collectionId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPaymentData();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadPaymentData]);

  /*
   * IMPORTANT:
   *
   * If the collection is CLOSED but the resident
   * already paid successfully, the receipt must
   * remain accessible.
   *
   * We therefore check the payment itself instead
   * of checking only collection.status.
   */
  useEffect(() => {
    if (!collection || !paymentStatus) {
      return;
    }

    const payment = paymentStatus.payment;

    const successfulPayment = payment?.status === "SUCCESS";

    const paid = paymentStatus.status === "PAID" || successfulPayment;

    if (paid && collection.status !== "ACTIVE") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowReceipt(true);
    }
  }, [collection, paymentStatus]);

  const handlePayment = async () => {
    try {
      setPaying(true);
      setErrorMessage("");
      setSuccessMessage("");

      /*
       * Frontend protection:
       *
       * Secretary should never start an online
       * special collection payment.
       */
      if (isSecretary) {
        setErrorMessage("Secretary accounts cannot make online payments for special collections.");

        setPaying(false);
        return;
      }

      /*
       * Frontend protection:
       *
       * Do not even open Razorpay if the collection
       * is no longer ACTIVE.
       */
      if (collection?.status !== "ACTIVE") {
        setErrorMessage(
          "This special collection is no longer active. New payments are not available."
        );

        setPaying(false);
        return;
      }

      const razorpayLoaded = await loadRazorpayCheckout();

      if (!razorpayLoaded) {
        throw new Error("Razorpay Checkout could not be loaded. Check your internet connection.");
      }

      const orderData = await createSpecialCollectionPaymentOrder(societyId, collectionId);

      if (!orderData?.orderId || !orderData?.amount || !orderData?.currency || !orderData?.key) {
        throw new Error("Invalid Razorpay order response");
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "MySociety",
        description: `Special Collection - ${collection.title}`,
        order_id: orderData.orderId,

        handler: async (response) => {
          try {
            setPaying(true);
            setErrorMessage("");
            setSuccessMessage("");

            await verifySpecialCollectionPayment(societyId, collectionId, {
              razorpay_order_id: response.razorpay_order_id,

              razorpay_payment_id: response.razorpay_payment_id,

              razorpay_signature: response.razorpay_signature
            });

            const updatedData = await loadPaymentData();

            const updatedStatus = updatedData?.status;

            const updatedPayment = updatedStatus?.payment;

            if (updatedStatus?.status === "PAID" && updatedPayment?.status === "SUCCESS") {
              setSuccessMessage(`Payment for "${collection.title}" was successful.`);

              /*
               * Show receipt immediately after
               * successful verification.
               */
              setShowReceipt(true);
            } else {
              setSuccessMessage(
                `Payment for "${collection.title}" was successful. Your receipt is available below.`
              );
            }
          } catch (error) {
            console.error("Special collection payment verification error:", error);

            setErrorMessage(getApiErrorMessage(error, "Payment verification failed."));
          } finally {
            setPaying(false);
          }
        },

        modal: {
          ondismiss: () => {
            setPaying(false);
          }
        },

        theme: {
          color: "#2563eb"
        }
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        console.error("RAZORPAY PAYMENT FAILED:", response);

        setPaying(false);

        setErrorMessage(
          response?.error?.description ||
            response?.error?.reason ||
            response?.error?.code ||
            "Payment failed."
        );
      });

      razorpay.open();
    } catch (error) {
      console.error("Special collection payment error:", error);

      const errorCode = error?.response?.data?.code;

      if (errorCode === "PAYMENT_ALREADY_COMPLETED") {
        setErrorMessage("");

        const updatedData = await loadPaymentData();

        const updatedStatus = updatedData?.status;

        const updatedPayment = updatedStatus?.payment;

        if (updatedStatus?.status === "PAID" && updatedPayment?.status === "SUCCESS") {
          setSuccessMessage(
            `Payment for "${collection.title}" was already completed successfully.`
          );

          setShowReceipt(true);
        } else {
          setErrorMessage(
            "Payment was completed, but the updated status could not be loaded. Please refresh the page."
          );
        }

        setPaying(false);
        return;
      }

      setPaying(false);

      setErrorMessage(getApiErrorMessage(error, "Unable to start payment."));
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const closeReceipt = () => {
    setShowReceipt(false);
  };

  if (loading) {
    return (
      <AppShell
        title="Special Collection Payment"
        description="Payment details"
        backTo={`/societies/${societyId}/special-collections/${collectionId}`}
      >
        <div className="mx-auto max-w-3xl">
          <div className="animate-pulse space-y-5">
            <div className="h-56 rounded-3xl bg-slate-200" />
            <div className="h-32 rounded-3xl bg-slate-200" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!collection) {
    return (
      <AppShell
        title="Special Collection Payment"
        description="Payment details"
        backTo={`/societies/${societyId}/special-collections`}
      >
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-900">Collection could not be found.</p>

          <p className="mt-2 text-sm text-red-700">
            {errorMessage || "The requested collection is unavailable."}
          </p>
        </div>
      </AppShell>
    );
  }

  /*
   * The payment object returned from the backend
   * contains the receipt information.
   */
  const paidPayment = paymentStatus?.payment || null;

  /*
   * IMPORTANT:
   *
   * Successful payment is checked independently
   * from collection status.
   *
   * This means CLOSED + SUCCESS is still PAID.
   */
  const paymentIsSuccessful = paidPayment?.status === "SUCCESS";

  const isPaid = paymentStatus?.status === "PAID" || paymentIsSuccessful;

  const isPending = paymentStatus?.status === "PENDING";

  const isOverdue = paymentStatus?.status === "OVERDUE";

  const isActive = collection.status === "ACTIVE";

  return (
    <AppShell
      title="Special Collection Payment"
      description="Review the collection and complete your payment."
      backTo={`/societies/${societyId}/special-collections/${collectionId}`}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">Payment issue</p>

            <p className="mt-1 text-sm leading-6 text-red-700">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">Payment successful</p>

            <p className="mt-1 text-sm leading-6 text-emerald-700">{successMessage}</p>
          </div>
        )}

        {/* COLLECTION DETAILS */}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)] sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                {collection.category}
              </span>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
                {collection.title}
              </h1>

              {collection.description && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {collection.description}
                </p>
              )}
            </div>

            <div className="shrink-0">
              <p className="text-xs font-medium text-slate-400">Amount to pay</p>

              <p className="mt-1 text-3xl font-bold text-slate-950">
                {formatAmount(collection.amount)}
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-400">Start date</p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {formatDate(collection.startDate)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400">Due date</p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {formatDate(collection.dueDate)}
              </p>
            </div>
          </div>

          {collection.paymentInstructions && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Payment instructions
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {collection.paymentInstructions}
              </p>
            </div>
          )}
        </section>

        {/* PAYMENT SECTION */}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)] sm:p-8">
          {isSecretary ? (
            /*
             * SECRETARY
             *
             * Secretaries can manage the collection
             * and record offline payments, but they
             * should not make online payments here.
             */
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-lg font-bold text-slate-900">Online payment unavailable</p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Secretary accounts cannot make online payments for special collections.
              </p>
            </div>
          ) : isPaid ? (
            /*
             * PAID
             *
             * This is deliberately checked first.
             *
             * ACTIVE + PAID   -> receipt
             * CLOSED + PAID   -> receipt
             * CANCELLED + PAID -> receipt
             */
            <div className="rounded-2xl bg-emerald-50 p-5">
              <p className="text-lg font-bold text-emerald-900">Payment completed</p>

              <p className="mt-2 text-sm leading-6 text-emerald-700">
                You have already successfully paid this collection.
              </p>

              {paidPayment?.paymentDate && (
                <p className="mt-2 text-sm font-semibold text-emerald-800">
                  Paid on {formatDate(paidPayment.paymentDate)}
                </p>
              )}

              {paidPayment?.receiptNumber && (
                <p className="mt-2 text-sm text-emerald-800">
                  Receipt number: <span className="font-semibold">{paidPayment.receiptNumber}</span>
                </p>
              )}

              {collection.status === "ACTIVE" && (
                <p className="mt-2 text-sm leading-6 text-emerald-700">
                  This collection is {collection.status?.toLowerCase()}. Your previous payment and
                  receipt remain available.
                </p>
              )}

              <button
                type="button"
                onClick={() => setShowReceipt(true)}
                className="mt-5 w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                View Receipt
              </button>
            </div>
          ) : !isActive ? (
            /*
             * CLOSED / CANCELLED / OTHER
             *
             * This is reached only when there is
             * no successful payment.
             */
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-lg font-bold text-slate-900">Payment is unavailable</p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                This collection is currently {collection.status?.toLowerCase() || "not active"}.
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                New payments are not available.
              </p>
            </div>
          ) : (
            /*
             * ACTIVE + NOT PAID
             */
            <div>
              <p className="text-lg font-bold text-slate-950">
                {isOverdue
                  ? "Payment is overdue"
                  : isPending
                    ? "Payment pending"
                    : "Complete your payment"}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isOverdue
                  ? "The due date has passed. You can still retry the payment while the collection is active."
                  : isPending
                    ? "You have not completed this collection payment yet. You can continue with payment."
                    : "Complete your one-time payment for this collection through Razorpay."}
              </p>

              <button
                type="button"
                onClick={handlePayment}
                disabled={paying}
                className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paying ? "Opening Razorpay..." : `Pay ${formatAmount(collection.amount)}`}
              </button>
            </div>
          )}
        </section>
      </div>

      {/* RECEIPT MODAL */}

      {showReceipt && paidPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            id="special-collection-receipt"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="border-b border-slate-200 pb-5 text-center">
              <h2 className="text-2xl font-bold text-slate-950">MySociety</h2>

              <p className="mt-1 text-sm text-slate-500">Special Collection Payment Receipt</p>
            </div>

            <div className="mt-6 space-y-4">
              {/* RECEIPT NUMBER */}

              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">Receipt Number</span>

                <span className="text-right text-sm font-semibold text-slate-900">
                  {paidPayment.receiptNumber || "—"}
                </span>
              </div>

              {/* COLLECTION */}

              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">Collection</span>

                <span className="max-w-[60%] text-right text-sm font-semibold text-slate-900">
                  {collection.title || "—"}
                </span>
              </div>

              {/* PURPOSE */}

              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">Purpose</span>

                <span className="max-w-[60%] text-right text-sm font-semibold text-slate-900">
                  {collection.description || collection.category || "—"}
                </span>
              </div>

              {/* FLAT */}

              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">Flat</span>

                <span className="text-sm font-semibold text-slate-900">
                  {paidPayment.flatId?.flatNumber || "—"}
                </span>
              </div>

              {/* AMOUNT */}

              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">Amount Paid</span>

                <span className="text-lg font-bold text-slate-900">
                  {formatAmount(paidPayment.amount)}
                </span>
              </div>

              {/* PAYMENT METHOD */}

              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">Payment Method</span>

                <span className="text-sm font-semibold text-slate-900">
                  {paidPayment.paymentMethod || "—"}
                </span>
              </div>

              {/* TRANSACTION ID */}

              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">Transaction ID</span>

                <span className="max-w-[60%] break-all text-right text-sm font-semibold text-slate-900">
                  {paidPayment.transactionId || paidPayment.razorpayPaymentId || "—"}
                </span>
              </div>

              {/* PAYMENT DATE */}

              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">Payment Date</span>

                <span className="text-sm font-semibold text-slate-900">
                  {formatDate(paidPayment.paymentDate)}
                </span>
              </div>

              {/* STATUS */}

              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">Status</span>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  PAID
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
              Payment received successfully.
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Print Receipt
              </button>

              <button
                type="button"
                onClick={closeReceipt}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default SpecialCollectionPaymentPage;
