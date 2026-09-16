import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";

import {
  getCurrentMaintenanceBill,
  getMaintenanceHistory,
  getMyPaymentHistory,
  getMaintenanceTransparency,
  createMaintenancePaymentOrder,
  verifyMaintenancePayment
} from "../api/maintenance.api.js";

import { loadRazorpayCheckout } from "../../subscriptions/utils/loadRazorpay.js";
import AppShell from "../../../components/common/AppShell.jsx";

// =====================================================
// HELPERS
// =====================================================

const getCurrentMonth = () => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

const formatAmount = (amount) => {
  if (amount === null || typeof amount === "undefined") {
    return "—";
  }

  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
};

const formatDate = (date) => {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString("en-IN");
};

const getStatusClasses = (status) => {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-700";

    case "OVERDUE":
      return "bg-red-100 text-red-700";

    case "NO_BILL":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-orange-100 text-orange-700";
  }
};

// =====================================================
// COMPONENT
// =====================================================

const MaintenancePage = () => {
  const { societyId } = useParams();

  // =====================================================
  // RESIDENT MAINTENANCE STATE
  // =====================================================

  const [currentBill, setCurrentBill] = useState(null);

  const [billHistory, setBillHistory] = useState([]);

  const [paymentHistory, setPaymentHistory] = useState([]);

  // =====================================================
  // TRANSPARENCY STATE
  // =====================================================

  const [transparencyMonth, setTransparencyMonth] = useState(getCurrentMonth());

  const [transparencyData, setTransparencyData] = useState([]);

  const [transparencyLoading, setTransparencyLoading] = useState(false);

  const [transparencyError, setTransparencyError] = useState("");

  // =====================================================
  // PAGE STATE
  // =====================================================

  const [loading, setLoading] = useState(true);

  const [paying, setPaying] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // =====================================================
  // LOAD RESIDENT MAINTENANCE DATA
  // =====================================================

  const loadMaintenanceData = useCallback(async () => {
    if (!societyId) {
      return;
    }

    try {
      setLoading(true);

      setError("");

      const [current, history, payments] = await Promise.all([
        getCurrentMaintenanceBill(societyId),

        getMaintenanceHistory(societyId),

        getMyPaymentHistory(societyId)
      ]);

      setCurrentBill(current);

      setBillHistory(Array.isArray(history) ? history : []);

      setPaymentHistory(Array.isArray(payments) ? payments : []);
    } catch (err) {
      console.error("Maintenance data error:", err);

      setError(
        err?.response?.data?.message || err?.message || "Failed to load maintenance details"
      );
    } finally {
      setLoading(false);
    }
  }, [societyId]);

  // =====================================================
  // LOAD TRANSPARENCY DATA
  // =====================================================

  const loadTransparency = useCallback(async () => {
    if (!societyId || !transparencyMonth) {
      return;
    }

    try {
      setTransparencyLoading(true);

      setTransparencyError("");

      const data = await getMaintenanceTransparency(societyId, transparencyMonth);

      // Backend response:
      //
      // {
      //   month: "2026-09",
      //   flats: [...]
      // }
      //
      // We only store the flats array
      // in transparencyData.

      setTransparencyData(Array.isArray(data?.flats) ? data.flats : []);
    } catch (err) {
      console.error("Transparency error:", err);

      setTransparencyData([]);

      setTransparencyError(
        err?.response?.data?.message || err?.message || "Failed to load maintenance transparency"
      );
    } finally {
      setTransparencyLoading(false);
    }
  }, [societyId, transparencyMonth]);

  // =====================================================
  // INITIAL LOAD
  // =====================================================
  useEffect(() => {
    const timer = setTimeout(() => {
      loadMaintenanceData();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadMaintenanceData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTransparency();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadTransparency]);
  // =====================================================
  // PAYMENT
  // =====================================================

  const handlePayment = async (bill) => {
    if (!bill) {
      return;
    }

    try {
      setPaying(true);

      setError("");

      setSuccess("");

      const razorpayLoaded = await loadRazorpayCheckout();

      if (!razorpayLoaded) {
        throw new Error("Razorpay Checkout could not be loaded");
      }

      // -------------------------------------------------
      // CREATE RAZORPAY ORDER
      // -------------------------------------------------

      const orderData = await createMaintenancePaymentOrder(societyId, bill._id);

      if (!orderData?.orderId || !orderData?.amount || !orderData?.currency || !orderData?.keyId) {
        throw new Error("Invalid Razorpay order response");
      }

      const options = {
        key: orderData.keyId,

        amount: orderData.amount,

        currency: orderData.currency,

        name: "MySociety",

        description: `Maintenance Bill - ${bill.month}`,

        order_id: orderData.orderId,

        handler: async (response) => {
          try {
            setPaying(true);

            setError("");

            setSuccess("");

            await verifyMaintenancePayment(societyId, {
              billId: bill._id,

              razorpay_order_id: response.razorpay_order_id,

              razorpay_payment_id: response.razorpay_payment_id,

              razorpay_signature: response.razorpay_signature
            });

            await loadMaintenanceData();

            await loadTransparency();

            setSuccess(`Maintenance payment for ${bill.month} was successful!`);
          } catch (err) {
            console.error("Payment verification error:", err);

            setError(err?.response?.data?.message || err?.message || "Payment verification failed");
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
        setPaying(false);

        setError(response?.error?.description || "Payment failed");
      });

      razorpay.open();
    } catch (err) {
      console.error("Payment error:", err);

      setPaying(false);

      setError(err?.response?.data?.message || err?.message || "Unable to start payment");
    }
  };

  // =====================================================
  // OUTSTANDING CALCULATIONS
  // =====================================================

  const unpaidBills = billHistory.filter((bill) => bill.status !== "PAID");

  const pendingBills = billHistory.filter((bill) => bill.status === "PENDING");

  const overdueBills = billHistory.filter((bill) => bill.status === "OVERDUE");

  const outstandingAmount = unpaidBills.reduce(
    (total, bill) => total + Number(bill.totalAmount || 0),
    0
  );

  // =====================================================
  // RECEIPT
  // =====================================================

  const openReceipt = (payment) => {
    setSelectedReceipt(payment);
  };

  const closeReceipt = () => {
    setSelectedReceipt(null);
  };

  const printReceipt = () => {
    window.print();
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <AppShell
        title="My Maintenance"
        description="View your maintenance bills, outstanding dues, payment history, and pay your bill online."
        backTo={`/societies/${societyId}/dashboard`}
      >
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

            <p className="mt-4 text-sm text-slate-500">Loading maintenance details...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <AppShell
      title="My Maintenance"
      description="View your maintenance bills, outstanding dues, payment history, and pay your bill online."
      backTo={`/societies/${societyId}/dashboard`}
    >
      <div className="space-y-8">
        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =====================================================
            SUCCESS
        ===================================================== */}

        {success && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* =====================================================
            OUTSTANDING SUMMARY
        ===================================================== */}

        <section>
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Payment Overview
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950">Outstanding Dues</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">
              <p className="text-sm font-medium text-slate-500">Total Outstanding</p>

              <p className="mt-2 text-3xl font-bold text-slate-950">
                {formatAmount(outstandingAmount)}
              </p>

              <p className="mt-2 text-sm text-slate-500">Unpaid maintenance bills</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">
              <p className="text-sm font-medium text-slate-500">Pending Bills</p>

              <p className="mt-2 text-3xl font-bold text-orange-600">{pendingBills.length}</p>

              <p className="mt-2 text-sm text-slate-500">Awaiting payment</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">
              <p className="text-sm font-medium text-slate-500">Overdue Bills</p>

              <p className="mt-2 text-3xl font-bold text-red-600">{overdueBills.length}</p>

              <p className="mt-2 text-sm text-slate-500">Payment overdue</p>
            </div>
          </div>
        </section>

        {/* =====================================================
            CURRENT BILL
        ===================================================== */}

        <section>
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Current
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950">Current Bill</h2>
          </div>

          {currentBill ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)] sm:p-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Maintenance Bill</p>

                  <h3 className="mt-1 text-2xl font-bold text-slate-950">{currentBill.month}</h3>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                    currentBill.status
                  )}`}
                >
                  {currentBill.status}
                </span>
              </div>

              <div className="mt-8">
                <p className="text-sm text-slate-500">Total Amount</p>

                <p className="mt-1 text-4xl font-bold text-slate-950">
                  {formatAmount(currentBill.totalAmount)}
                </p>
              </div>

              <div className="mt-8 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-slate-500">Maintenance</p>

                  <p className="mt-1 font-semibold text-slate-950">
                    {formatAmount(currentBill.maintenanceAmount)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Late Fee</p>

                  <p className="mt-1 font-semibold text-slate-950">
                    {formatAmount(currentBill.lateFee)}

                    {currentBill.status !== "OVERDUE" && currentBill.status !== "PAID" && (
                      <span className="ml-1 text-xs font-normal text-slate-400">if overdue</span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Due Date</p>

                  <p className="mt-1 font-semibold text-slate-950">
                    {formatDate(currentBill.dueDate)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Adjustment Reason</p>

                  <p className="mt-1 font-semibold text-slate-950">
                    {currentBill.adjustmentReason || "No adjustment"}
                  </p>
                </div>
              </div>

              {currentBill.status !== "PAID" && (
                <button
                  type="button"
                  onClick={() => handlePayment(currentBill)}
                  disabled={paying}
                  className="mt-8 w-full rounded-xl bg-slate-950 px-5 py-3.5 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {paying ? "Processing..." : `Pay ${formatAmount(currentBill.totalAmount)}`}
                </button>
              )}

              {currentBill.status === "PAID" && (
                <div className="mt-8 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-center text-sm font-medium text-green-700">
                  ✓ This bill has been paid successfully.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
              No maintenance bill found.
            </div>
          )}
        </section>

        {/* =====================================================
            BILL HISTORY
        ===================================================== */}

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Previous Bills
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-950">Bill History</h2>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {billHistory.length} bills
            </span>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">
            {billHistory.length === 0 ? (
              <div className="p-10 text-center text-slate-500">No bill history available.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Month
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Due Date
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Adjustment Reason
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {billHistory.map((bill) => (
                      <tr key={bill._id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                          {bill.month}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatAmount(bill.totalAmount)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(bill.dueDate)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              bill.status
                            )}`}
                          >
                            {bill.status}
                          </span>
                        </td>

                        <td className="max-w-xs px-5 py-4 text-sm text-slate-600">
                          {bill.adjustmentReason || "No adjustment"}
                        </td>

                        <td className="px-5 py-4">
                          {bill.status !== "PAID" ? (
                            <button
                              type="button"
                              onClick={() => handlePayment(bill)}
                              disabled={paying}
                              className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {paying ? "Processing..." : `Pay ${formatAmount(bill.totalAmount)}`}
                            </button>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            MAINTENANCE TRANSPARENCY
        ===================================================== */}

        <section>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Society Transparency
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-950">Maintenance Transparency</h2>

              <p className="mt-1 text-sm text-slate-500">
                View maintenance payment status for all society flats.
              </p>
            </div>

            <div>
              <label
                htmlFor="transparency-month"
                className="mb-1 block text-xs font-semibold text-slate-500"
              >
                Billing Month
              </label>

              <input
                id="transparency-month"
                type="month"
                value={transparencyMonth}
                onChange={(e) => {
                  setTransparencyMonth(e.target.value);

                  setTransparencyError("");
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">
            {transparencyError && (
              <div className="border-b border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {transparencyError}
              </div>
            )}

            {transparencyLoading ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Loading maintenance transparency...
              </div>
            ) : transparencyData.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                No maintenance information available for {transparencyMonth}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Flat
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Payment Date
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {transparencyData.map((item, index) => (
                      <tr
                        key={item.flatId || `${item.flatNumber}-${index}`}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                          {item.flatNumber || "N/A"}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                          {formatAmount(item.amount)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              item.status
                            )}`}
                          >
                            {item.status || "PENDING"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {item.status === "PAID" ? formatDate(item.paymentDate) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Only flat number, bill amount, payment status, and payment date are shown for
            transparency. Private transaction details are not displayed.
          </p>
        </section>

        {/* =====================================================
            PAYMENT HISTORY
        ===================================================== */}

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Transactions
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-950">Payment History</h2>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {paymentHistory.length} payments
            </span>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">
            {paymentHistory.length === 0 ? (
              <div className="p-10 text-center text-slate-500">No payments recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Bill
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Method
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Receipt
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paymentHistory.map((payment) => (
                      <tr key={payment._id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(payment.paymentDate)}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                          {payment.billId?.month || "—"}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                          {formatAmount(payment.amount)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {payment.paymentMethod}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              payment.status === "SUCCESS"
                                ? "bg-green-100 text-green-700"
                                : payment.status === "FAILED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {payment.receiptNumber || "—"}
                        </td>

                        <td className="px-5 py-4">
                          {payment.status === "SUCCESS" ? (
                            <button
                              type="button"
                              onClick={() => openReceipt(payment)}
                              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              View Receipt
                            </button>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* =====================================================
          RECEIPT MODAL
      ===================================================== */}

      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            id="maintenance-receipt"
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="border-b border-slate-200 pb-5 text-center">
              <h2 className="text-2xl font-bold text-slate-950">MySociety</h2>

              <p className="mt-1 text-sm text-slate-500">Maintenance Payment Receipt</p>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">Receipt Number</span>

                <span className="text-sm font-semibold text-slate-900">
                  {selectedReceipt.receiptNumber || "—"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">Bill Month</span>

                <span className="text-sm font-semibold text-slate-900">
                  {selectedReceipt.billId?.month || "—"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">Flat</span>

                <span className="text-sm font-semibold text-slate-900">
                  {selectedReceipt.flatId?.flatNumber || "—"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">Amount Paid</span>

                <span className="text-lg font-bold text-slate-900">
                  {formatAmount(selectedReceipt.amount)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">Payment Method</span>

                <span className="text-sm font-semibold text-slate-900">
                  {selectedReceipt.paymentMethod}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">Payment Date</span>

                <span className="text-sm font-semibold text-slate-900">
                  {formatDate(selectedReceipt.paymentDate)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500">Status</span>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  PAID
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm text-green-700">
              Payment received successfully.
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={printReceipt}
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
};

export default MaintenancePage;
