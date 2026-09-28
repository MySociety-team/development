import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import {
  getSpecialCollection,
  getSpecialCollectionPayments,
  refundSpecialCollectionPayment
} from "../api/specialCollection.api.js";

function formatPaymentMethod(method) {
  switch (method) {
    case "RAZORPAY":
      return "Razorpay";
    case "CASH":
      return "Cash";
    case "UPI":
      return "UPI";
    case "BANK_TRANSFER":
      return "Bank Transfer";
    case "OTHER":
      return "Other";
    default:
      return method || "N/A";
  }
}

function formatPaymentDate(paymentDate, paymentMethod) {
  if (!paymentDate) {
    return "N/A";
  }

  const date = new Date(paymentDate);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  const offlineMethods = ["CASH", "UPI", "BANK_TRANSFER", "OTHER"];

  if (offlineMethods.includes(paymentMethod)) {
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "numeric",
      year: "numeric"
    });
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getDateValue(paymentDate) {
  if (!paymentDate) {
    return "";
  }

  const date = new Date(paymentDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStatusClasses(status) {
  switch (status) {
    case "SUCCESS":
      return "bg-emerald-50 text-emerald-700";

    case "PENDING":
      return "bg-amber-50 text-amber-700";

    case "OVERDUE":
      return "bg-orange-50 text-orange-700";

    case "FAILED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getStatusLabel(status) {
  switch (status) {
    case "SUCCESS":
      return "Paid";

    case "PENDING":
      return "Pending";

    case "OVERDUE":
      return "Overdue";

    case "FAILED":
      return "Failed";

    default:
      return status || "Unknown";
  }
}

function SpecialCollectionPaymentsPage() {
  const { societyId, collectionId } = useParams();

  const [collection, setCollection] = useState(null);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [amountFilter, setAmountFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [refundingPaymentId, setRefundingPaymentId] = useState(null);

  const [refundError, setRefundError] = useState("");

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [collectionData, paymentData] = await Promise.all([
        getSpecialCollection(societyId, collectionId),
        getSpecialCollectionPayments(societyId, collectionId)
      ]);

      setCollection(collectionData);

      setPayments(Array.isArray(paymentData) ? paymentData : []);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message || error?.message || "Failed to load payments"
      );
    } finally {
      setLoading(false);
    }
  }, [societyId, collectionId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPayments();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadPayments]);

  const paymentStats = useMemo(() => {
    const isCancelled = collection?.status === "CANCELLED";

    if (isCancelled) {
      return {
        paidCount: 0,
        remainingCount: 0,
        paidAmount: 0,
        remainingAmount: 0
      };
    }

    const paid = payments.filter(
      (payment) => payment.status === "SUCCESS" && payment.refundStatus !== "REFUNDED"
    );

    const remaining = payments.filter(
      (payment) => payment.status !== "SUCCESS" && payment.refundStatus !== "REFUNDED"
    );

    const paidAmount = paid.reduce((total, payment) => total + Number(payment.amount || 0), 0);

    const remainingAmount = remaining.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    );

    return {
      paidCount: paid.length,
      remainingCount: remaining.length,
      paidAmount,
      remainingAmount
    };
  }, [payments, collection]);

  /*
   * Search and filters
   */
  const filteredPayments = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const residentName = payment.residentId?.userId?.name || "";

      const flatNumber = payment.flatId?.flatNumber || "";

      const transactionId = payment.transactionId || "";

      const receiptNumber = payment.receiptNumber || "";

      const matchesSearch =
        !searchValue ||
        residentName.toLowerCase().includes(searchValue) ||
        String(flatNumber).toLowerCase().includes(searchValue) ||
        transactionId.toLowerCase().includes(searchValue) ||
        receiptNumber.toLowerCase().includes(searchValue);

      const matchesPaymentMethod =
        !paymentMethodFilter || payment.paymentMethod === paymentMethodFilter;

      const matchesAmount = !amountFilter || Number(payment.amount) === Number(amountFilter);

      const matchesDate = !dateFilter || getDateValue(payment.paymentDate) === dateFilter;

      const matchesStatus = !statusFilter || payment.status === statusFilter;

      return matchesSearch && matchesPaymentMethod && matchesAmount && matchesDate && matchesStatus;
    });
  }, [payments, search, paymentMethodFilter, amountFilter, dateFilter, statusFilter]);

  /*
   * Normal collection:
   * Paid = successful and not refunded
   * Remaining = not successfully paid
   */
  const paidPayments = useMemo(() => {
    if (collection?.status === "CANCELLED") {
      return [];
    }

    return filteredPayments.filter(
      (payment) => payment.status === "SUCCESS" && payment.refundStatus !== "REFUNDED"
    );
  }, [filteredPayments, collection]);

  const remainingPayments = useMemo(() => {
    if (collection?.status === "CANCELLED") {
      return [];
    }

    return filteredPayments.filter(
      (payment) => payment.status !== "SUCCESS" && payment.refundStatus !== "REFUNDED"
    );
  }, [filteredPayments, collection]);

  /*
   * CANCELLED COLLECTION
   *
   * Refund pending:
   * Successfully paid but not refunded yet.
   */
  const refundPendingPayments = useMemo(() => {
    if (collection?.status !== "CANCELLED") {
      return [];
    }

    return filteredPayments.filter(
      (payment) => payment.status === "SUCCESS" && payment.refundStatus !== "REFUNDED"
    );
  }, [filteredPayments, collection]);

  /*
   * CANCELLED COLLECTION
   *
   * Already refunded people.
   */
  const refundedPayments = useMemo(() => {
    if (collection?.status !== "CANCELLED") {
      return [];
    }

    return filteredPayments.filter((payment) => payment.refundStatus === "REFUNDED");
  }, [filteredPayments, collection]);

  const clearFilters = () => {
    setSearch("");
    setPaymentMethodFilter("");
    setAmountFilter("");
    setDateFilter("");
    setStatusFilter("");
  };

  const handleRefund = async (payment) => {
    if (collection?.status !== "CANCELLED") {
      setRefundError("Refunds are only available for cancelled collections.");
      return;
    }

    const residentName = payment.residentId?.userId?.name || "this resident";

    const amount = Number(payment.amount || 0);

    const confirmed = window.confirm(
      `Mark ₹${amount.toLocaleString(
        "en-IN"
      )} refund for ${residentName}?\n\nThe resident can collect the refund from the Secretary or Society Office.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRefundingPaymentId(payment._id);
      setRefundError("");

      await refundSpecialCollectionPayment(societyId, payment._id);

      await loadPayments();
    } catch (error) {
      setRefundError(error?.response?.data?.message || error?.message || "Refund failed");
    } finally {
      setRefundingPaymentId(null);
    }
  };

  const hasFilters = search || paymentMethodFilter || amountFilter || dateFilter || statusFilter;

  /*
   * NORMAL PAYMENT CARD
   *
   * Used for ACTIVE / CLOSED collections.
   */
  const renderPaymentCard = (payment) => {
    return (
      <div
        key={payment._id}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)] sm:p-7"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Resident
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-950">
              {payment.residentId?.userId?.name || "N/A"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Flat {payment.flatId?.flatNumber || "N/A"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Amount</p>

            <p className="mt-1 text-xl font-bold text-slate-950">
              ₹{Number(payment.amount || 0).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-slate-400">Payment Method</p>

            <p className="mt-1 text-sm font-semibold text-slate-700">
              {formatPaymentMethod(payment.paymentMethod)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Status</p>

            <span
              className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                payment.status
              )}`}
            >
              {getStatusLabel(payment.status)}
            </span>
          </div>

          <div>
            <p className="text-xs text-slate-400">Payment Date</p>

            <p className="mt-1 text-sm font-semibold text-slate-700">
              {formatPaymentDate(payment.paymentDate, payment.paymentMethod)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Receipt</p>

            <p className="mt-1 text-sm font-semibold text-slate-700">
              {payment.receiptNumber || "N/A"}
            </p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs text-slate-400">Transaction ID</p>

            <p className="mt-1 break-all text-sm font-semibold text-slate-700">
              {payment.transactionId || payment.razorpayPaymentId || "N/A"}
            </p>
          </div>
        </div>

        {payment.status === "PENDING" && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-bold text-amber-900">Payment Pending</p>

            <p className="mt-1 text-sm text-amber-800">This payment is still pending.</p>
          </div>
        )}

        {payment.status === "OVERDUE" && (
          <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm font-bold text-orange-900">Payment Overdue</p>

            <p className="mt-1 text-sm text-orange-800">
              This payment has not been completed before the due date.
            </p>
          </div>
        )}

        {payment.status === "FAILED" && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-bold text-red-900">Payment Failed</p>

            <p className="mt-1 text-sm text-red-800">
              This payment was not completed successfully.
            </p>
          </div>
        )}
      </div>
    );
  };

  /*
   * REFUND PENDING CARD
   *
   * Only shown for CANCELLED collections.
   */
  const renderRefundPendingCard = (payment) => {
    const residentName = payment.residentId?.userId?.name || "N/A";

    const flatNumber = payment.flatId?.flatNumber || "N/A";

    const amount = Number(payment.amount || 0);

    const isRefunding = refundingPaymentId === payment._id;

    return (
      <div
        key={payment._id}
        className="rounded-3xl border border-red-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold text-slate-950">{residentName}</p>

            <p className="mt-1 text-sm text-slate-500">Flat {flatNumber}</p>

            <p className="mt-3 text-xl font-bold text-slate-950">
              ₹{amount.toLocaleString("en-IN")}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Paid by {formatPaymentMethod(payment.paymentMethod)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleRefund(payment)}
            disabled={isRefunding}
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefunding ? "Processing..." : "Refund Payment"}
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm font-bold text-orange-900">Refund to be collected offline</p>

          <p className="mt-1 text-sm text-orange-800">
            The resident can collect ₹{amount.toLocaleString("en-IN")} from the Secretary or Society
            Office.
          </p>
        </div>
      </div>
    );
  };

  /*
   * REFUNDED CARD
   *
   * IMPORTANT:
   * Refund Transaction ID is intentionally NOT shown.
   */
  const renderRefundedCard = (payment) => {
    const residentName = payment.residentId?.userId?.name || "N/A";

    const flatNumber = payment.flatId?.flatNumber || "N/A";

    const refundAmount = Number(payment.refundAmount || payment.amount || 0);

    return (
      <div key={payment._id} className="rounded-3xl border border-emerald-200 bg-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-bold text-slate-950">{residentName}</p>

            <p className="mt-1 text-sm text-slate-500">Flat {flatNumber}</p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-slate-400">Refund Amount</p>

            <p className="mt-1 text-xl font-bold text-emerald-700">
              ₹{refundAmount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-slate-400">Original Payment Method</p>

            <p className="mt-1 text-sm font-semibold text-slate-700">
              {formatPaymentMethod(payment.paymentMethod)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Original Payment Date</p>

            <p className="mt-1 text-sm font-semibold text-slate-700">
              {formatPaymentDate(payment.paymentDate, payment.paymentMethod)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Refund Date</p>

            <p className="mt-1 text-sm font-semibold text-slate-700">
              {formatPaymentDate(payment.refundDate, payment.paymentMethod)}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-900">Payment Refunded</p>

          <p className="mt-1 text-sm text-emerald-800">
            Refund completed. The resident has collected the refund from the Secretary or Society
            Office.
          </p>
        </div>
      </div>
    );
  };

  return (
    <AppShell
      title="Special Collection Payments"
      description="See who has paid and who is remaining for this collection."
      backTo={`/societies/${societyId}/special-collections/${collectionId}`}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">Loading payments...</p>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-900">Unable to load payments</p>

            <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {!loading && !errorMessage && (
          <>
            {refundError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="font-semibold text-red-900">Refund failed</p>

                <p className="mt-1 text-sm text-red-700">{refundError}</p>
              </div>
            )}

            {/* COLLECTION HEADER */}
            {collection && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Collection
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-950">
                      {collection.title || "Special Collection"}
                    </h2>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-xs font-bold ${
                      collection.status === "CANCELLED"
                        ? "bg-red-50 text-red-700"
                        : collection.status === "CLOSED"
                          ? "bg-slate-100 text-slate-700"
                          : collection.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {collection.status || "UNKNOWN"}
                  </span>
                </div>
              </section>
            )}

            {/* ======================================================
                CANCELLED COLLECTION
               ====================================================== */}
            {collection?.status === "CANCELLED" ? (
              <>
                {/* REFUND ACTION AREA */}
                <section className="rounded-3xl border border-red-200 bg-red-50 p-6 sm:p-8">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-600">
                      Cancelled Collection
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-red-950">
                      Collect Refund from Secretary / Society Office
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-red-800">
                      This collection has been cancelled. Residents who already paid should receive
                      their money back from the Secretary or Society Office.
                    </p>
                  </div>

                  <div className="mt-6 rounded-2xl border border-red-200 bg-white p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">Refunds Pending</p>

                        <p className="mt-1 text-sm text-slate-500">
                          {refundPendingPayments.length} payment
                          {refundPendingPayments.length === 1 ? "" : "s"} still need to be refunded.
                        </p>
                      </div>

                      <p className="text-lg font-bold text-red-700">
                        ₹
                        {refundPendingPayments
                          .reduce((total, payment) => total + Number(payment.amount || 0), 0)
                          .toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {refundPendingPayments.length === 0 ? (
                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                      <p className="font-semibold text-emerald-800">
                        All payments have been refunded.
                      </p>

                      <p className="mt-1 text-sm text-emerald-700">
                        There are no pending refunds for this cancelled collection.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      {refundPendingPayments.map(renderRefundPendingCard)}
                    </div>
                  )}
                </section>

                {/* REFUNDED PEOPLE */}
                <section>
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Completed Refunds
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-slate-950">Refunded People</h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Residents whose refund has already been marked as completed.
                    </p>
                  </div>

                  {refundedPayments.length === 0 ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6">
                      <p className="font-semibold text-slate-800">No refunded payments yet.</p>

                      <p className="mt-1 text-sm text-slate-500">
                        Refunded residents will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">{refundedPayments.map(renderRefundedCard)}</div>
                  )}
                </section>
              </>
            ) : (
              <>
                {/* ==================================================
                    NORMAL COLLECTION SUMMARY
                   ================================================== */}
                <section className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                      Paid
                    </p>

                    <p className="mt-2 text-3xl font-bold text-emerald-800">
                      {paymentStats.paidCount}
                    </p>

                    <p className="mt-1 text-sm text-emerald-700">
                      ₹{paymentStats.paidAmount.toLocaleString("en-IN")} collected
                    </p>
                  </div>

                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                      Remaining
                    </p>

                    <p className="mt-2 text-3xl font-bold text-amber-800">
                      {paymentStats.remainingCount}
                    </p>

                    <p className="mt-1 text-sm text-amber-700">
                      ₹{paymentStats.remainingAmount.toLocaleString("en-IN")} remaining
                    </p>
                  </div>
                </section>

                {/* ==================================================
                    FILTERS
                   ================================================== */}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)] sm:p-8">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Payment tracking
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-slate-950">Search & Filters</h2>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="lg:col-span-2">
                      <label
                        htmlFor="payment-search"
                        className="block text-sm font-semibold text-slate-700"
                      >
                        Search Resident / Flat / Transaction
                      </label>

                      <input
                        id="payment-search"
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Resident, flat, receipt or transaction ID"
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="payment-method-filter"
                        className="block text-sm font-semibold text-slate-700"
                      >
                        Payment Method
                      </label>

                      <select
                        id="payment-method-filter"
                        value={paymentMethodFilter}
                        onChange={(event) => setPaymentMethodFilter(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                      >
                        <option value="">All Methods</option>

                        <option value="RAZORPAY">Razorpay</option>

                        <option value="CASH">Cash</option>

                        <option value="UPI">UPI</option>

                        <option value="BANK_TRANSFER">Bank Transfer</option>

                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="payment-status-filter"
                        className="block text-sm font-semibold text-slate-700"
                      >
                        Status
                      </label>

                      <select
                        id="payment-status-filter"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                      >
                        <option value="">All Statuses</option>

                        <option value="SUCCESS">Paid</option>

                        <option value="PENDING">Pending</option>

                        <option value="OVERDUE">Overdue</option>

                        <option value="FAILED">Failed</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="payment-amount-filter"
                        className="block text-sm font-semibold text-slate-700"
                      >
                        Amount
                      </label>

                      <input
                        id="payment-amount-filter"
                        type="number"
                        min="0"
                        value={amountFilter}
                        onChange={(event) => setAmountFilter(event.target.value)}
                        placeholder="e.g. 500"
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="payment-date-filter"
                        className="block text-sm font-semibold text-slate-700"
                      >
                        Payment Date
                      </label>

                      <input
                        id="payment-date-filter"
                        type="date"
                        value={dateFilter}
                        onChange={(event) => setDateFilter(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">
                      Showing{" "}
                      <span className="font-semibold text-slate-800">
                        {filteredPayments.length}
                      </span>{" "}
                      of <span className="font-semibold text-slate-800">{payments.length}</span>{" "}
                      payment records
                    </p>

                    {hasFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </section>

                {/* ==================================================
                    NORMAL PAYMENT LIST
                   ================================================== */}
                {payments.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
                    <p className="font-semibold text-slate-800">No payment records found.</p>
                  </div>
                ) : filteredPayments.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
                    <p className="font-semibold text-slate-800">No matching payments found.</p>

                    <p className="mt-2 text-sm text-slate-500">
                      Try changing or clearing your filters.
                    </p>

                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <>
                    <section>
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-slate-950">Paid</h2>

                          <p className="mt-1 text-sm text-slate-500">
                            Residents who have successfully paid.
                          </p>
                        </div>

                        <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                          {paidPayments.length} Paid
                        </span>
                      </div>

                      {paidPayments.length === 0 ? (
                        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                          <p className="font-semibold text-emerald-800">No one has paid yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">{paidPayments.map(renderPaymentCard)}</div>
                      )}
                    </section>

                    <section>
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-slate-950">Remaining</h2>

                          <p className="mt-1 text-sm text-slate-500">
                            Residents whose payment is not currently collected.
                          </p>
                        </div>

                        <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">
                          {remainingPayments.length} Remaining
                        </span>
                      </div>

                      {remainingPayments.length === 0 ? (
                        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                          <p className="font-semibold text-emerald-800">Everyone has paid.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">{remainingPayments.map(renderPaymentCard)}</div>
                      )}
                    </section>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

export default SpecialCollectionPaymentsPage;
