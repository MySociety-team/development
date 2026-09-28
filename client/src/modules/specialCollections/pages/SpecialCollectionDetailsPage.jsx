import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { getSociety } from "../../societies/api/society.api.js";

import {
  activateSpecialCollection,
  cancelSpecialCollection,
  closeSpecialCollection,
  getSpecialCollection,
  getSpecialCollectionSummary,
  getResidentCollectionStatus,
  getSpecialCollectionPayments,
  recordOfflinePayment
} from "../api/specialCollection.api.js";

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

function formatAmount(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function getStatusClassName(status) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";
    case "CLOSED":
      return "bg-slate-100 text-slate-600";
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    case "DRAFT":
    default:
      return "bg-amber-50 text-amber-700";
  }
}

function getStatusLabel(status) {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "CLOSED":
      return "Closed";
    case "CANCELLED":
      return "Cancelled";
    case "DRAFT":
      return "Draft";
    default:
      return status || "Unknown";
  }
}

function SpecialCollectionDetailsPage() {
  const { societyId, collectionId } = useParams();
  const navigate = useNavigate();

  const [collection, setCollection] = useState(null);
  const [summary, setSummary] = useState(null);
  const [membership, setMembership] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const [paymentStatusLoading, setPaymentStatusLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [showOfflinePayment, setShowOfflinePayment] = useState(false);

  const [offlinePayments, setOfflinePayments] = useState([]);

  const [offlineLoading, setOfflineLoading] = useState(false);

  const [offlineSaving, setOfflineSaving] = useState(false);

  const [offlineError, setOfflineError] = useState("");

  const [offlineSuccess, setOfflineSuccess] = useState("");

  const [offlineForm, setOfflineForm] = useState({
    residentId: "",
    flatId: "",
    amount: "",
    paymentMethod: "CASH",
    paymentDate: new Date().toISOString().slice(0, 10),
    transactionId: "",
    remarks: ""
  });

  const loadDetails = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      setPaymentStatusLoading(true);

      const [collectionData, societyData] = await Promise.all([
        getSpecialCollection(societyId, collectionId),
        getSociety(societyId)
      ]);

      setCollection(collectionData);

      const currentMembership = societyData?.membership || null;

      setMembership(currentMembership);

      /*
       * Payment status is relevant only to residents.
       *
       * A secretary should not get payment/receipt
       * information on this details page.
       */
      if (currentMembership?.role === "SECRETARY") {
        setPaymentStatus(null);
        setPaymentStatusLoading(false);
      } else {
        try {
          const paymentStatusData = await getResidentCollectionStatus(societyId, collectionId);

          setPaymentStatus(paymentStatusData || null);
        } catch (error) {
          console.error("Unable to load collection payment status:", error);

          setPaymentStatus(null);
        }

        setPaymentStatusLoading(false);
      }

      /*
       * Secretary-only summary.
       */
      if (currentMembership?.role === "SECRETARY") {
        try {
          const summaryData = await getSpecialCollectionSummary(societyId, collectionId);

          setSummary(summaryData);
        } catch {
          setSummary(null);
        }
      } else {
        setSummary(null);
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load special collection details."));

      setPaymentStatusLoading(false);
    } finally {
      setLoading(false);
    }
  }, [societyId, collectionId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDetails();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadDetails]);

  const isSecretary = membership?.role === "SECRETARY";

  /*
   * A successful payment is the source of truth.
   *
   * This intentionally does NOT depend on collection.status.
   *
   * ACTIVE + SUCCESS = PAID
   * CLOSED + SUCCESS = PAID
   * CANCELLED + SUCCESS = PAID
   */
  const successfulPayment =
    paymentStatus?.payment && paymentStatus.payment.status === "SUCCESS"
      ? paymentStatus.payment
      : null;

  const isPaid = paymentStatus?.status === "PAID" || Boolean(successfulPayment);

  const loadOfflinePayments = async () => {
    try {
      setOfflineLoading(true);
      setOfflineError("");

      const data = await getSpecialCollectionPayments(societyId, collectionId);

      setOfflinePayments(Array.isArray(data) ? data : []);
    } catch (error) {
      setOfflineError(getApiErrorMessage(error, "Unable to load residents."));
    } finally {
      setOfflineLoading(false);
    }
  };

  const openOfflinePayment = async () => {
    setOfflineError("");
    setOfflineSuccess("");

    setOfflineForm({
      residentId: "",
      flatId: "",
      amount: collection?.amount || "",
      paymentMethod: "CASH",
      paymentDate: new Date().toISOString().slice(0, 10),
      transactionId: "",
      remarks: ""
    });

    setShowOfflinePayment(true);

    await loadOfflinePayments();
  };

  const closeOfflinePayment = () => {
    if (offlineSaving) {
      return;
    }

    setShowOfflinePayment(false);
    setOfflineError("");
    setOfflineSuccess("");
  };

  const handleOfflineResidentChange = (event) => {
    const residentId = event.target.value;

    const selectedResident = offlinePayments.find(
      (payment) => String(payment.residentId?._id) === String(residentId)
    );

    setOfflineForm((current) => ({
      ...current,
      residentId,
      flatId: selectedResident?.flatId?._id || selectedResident?.flatId || ""
    }));

    setOfflineError("");
  };

  const handleOfflineChange = (event) => {
    const { name, value } = event.target;

    setOfflineForm((current) => ({
      ...current,
      [name]: value
    }));

    setOfflineError("");
  };

  const handleOfflineSubmit = async (event) => {
    event.preventDefault();

    try {
      setOfflineSaving(true);
      setOfflineError("");
      setOfflineSuccess("");

      if (!offlineForm.residentId) {
        setOfflineError("Please select a resident.");
        return;
      }

      if (!offlineForm.flatId) {
        setOfflineError("Flat information could not be found for this resident.");
        return;
      }

      if (Number(offlineForm.amount) !== Number(collection.amount)) {
        setOfflineError(`Amount must be ${formatAmount(collection.amount)}.`);
        return;
      }

      await recordOfflinePayment(societyId, {
        collectionId,
        residentId: offlineForm.residentId,
        flatId: offlineForm.flatId,
        amount: Number(offlineForm.amount),
        paymentMethod: offlineForm.paymentMethod,
        paymentDate: offlineForm.paymentDate,
        transactionId: offlineForm.transactionId || null,
        remarks: offlineForm.remarks || ""
      });

      setOfflineSuccess("Offline payment recorded successfully.");

      await loadDetails();
      await loadOfflinePayments();

      setTimeout(() => {
        setShowOfflinePayment(false);
        setOfflineSuccess("");
      }, 1200);
    } catch (error) {
      setOfflineError(getApiErrorMessage(error, "Unable to record offline payment."));
    } finally {
      setOfflineSaving(false);
    }
  };

  const handleStatusChange = async (action, successMessage) => {
    try {
      setActionLoading(true);
      setErrorMessage("");

      if (action === "activate") {
        await activateSpecialCollection(societyId, collectionId);
      }

      if (action === "close") {
        await closeSpecialCollection(societyId, collectionId);
      }

      if (action === "cancel") {
        await cancelSpecialCollection(societyId, collectionId);
      }

      await loadDetails();

      window.alert(successMessage);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to update collection status."));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayNow = () => {
    navigate(`/societies/${societyId}/special-collections/${collectionId}/pay`);
  };

  const offlineResidentOptions = [];

  const seenResidents = new Set();

  for (const payment of offlinePayments) {
    const resident = payment.residentId;

    if (!resident?._id) {
      continue;
    }

    if (payment.status === "SUCCESS") {
      continue;
    }

    const residentId = String(resident._id);

    if (seenResidents.has(residentId)) {
      continue;
    }

    seenResidents.add(residentId);

    offlineResidentOptions.push(payment);
  }

  if (loading) {
    return (
      <AppShell
        title="Special Collection"
        description="Collection details"
        backTo={`/societies/${societyId}/special-collections`}
      >
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse space-y-5">
            <div className="h-56 rounded-3xl bg-slate-200" />
            <div className="h-40 rounded-3xl bg-slate-200" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!collection) {
    return (
      <AppShell
        title="Special Collection"
        description="Collection details"
        backTo={`/societies/${societyId}/special-collections`}
      >
        <div className="mx-auto max-w-4xl rounded-3xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-900">Collection could not be found.</p>

          <p className="mt-2 text-sm text-red-700">
            {errorMessage || "The requested collection is unavailable."}
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={collection.title}
      description="Special collection details"
      backTo={`/societies/${societyId}/special-collections`}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">Something went wrong</p>

            <p className="mt-1 text-sm leading-6 text-red-700">{errorMessage}</p>
          </div>
        )}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">
          {collection.imageUrl && (
            <div className="bg-slate-100">
              <img
                src={collection.imageUrl}
                alt={collection.title || "Collection"}
                className="h-64 w-full object-cover sm:h-80"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                    {collection.category}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getStatusClassName(
                      collection.status
                    )}`}
                  >
                    {getStatusLabel(collection.status)}
                  </span>
                </div>

                <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
                  {collection.title}
                </h1>

                {collection.description && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                    {collection.description}
                  </p>
                )}
              </div>

              <div className="shrink-0">
                <p className="text-xs font-medium text-slate-400">Collection amount</p>

                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {formatAmount(collection.amount)}
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
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

              <div>
                <p className="text-xs font-medium text-slate-400">Audience</p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {collection.audienceType === "ALL_FLATS"
                    ? "All Flats"
                    : collection.audienceType === "SELECTED_FLATS"
                      ? "Selected Flats"
                      : "Selected Residents"}
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

            {collection.documentUrl && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Supporting document
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Open the document attached to this special collection.
                </p>

                <a
                  href={collection.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  View Document
                </a>
              </div>
            )}
          </div>
        </section>

        {!isSecretary && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)] sm:p-8">
            {paymentStatusLoading ? (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Payment status
                </p>

                <p className="mt-2 text-sm text-slate-500">Checking payment status...</p>
              </div>
            ) : isPaid ? (
              <>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                    Payment completed
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-slate-950">✓ Paid</h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    You have already paid this special collection.
                  </p>

                  {successfulPayment?.receiptNumber && (
                    <p className="mt-3 text-sm text-slate-600">
                      Receipt number:{" "}
                      <span className="font-semibold text-slate-900">
                        {successfulPayment.receiptNumber}
                      </span>
                    </p>
                  )}

                  {collection.status !== "ACTIVE" && (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      This collection is {getStatusLabel(collection.status).toLowerCase()}. Your
                      previous payment and receipt are still available.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handlePayNow}
                  className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                >
                  View Receipt
                </button>
              </>
            ) : collection.status === "ACTIVE" ? (
              <>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Payment
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-slate-950">Pay this collection</h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Complete your one-time payment for this collection through Razorpay.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePayNow}
                  className="mt-5 w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                >
                  Pay {formatAmount(collection.amount)}
                </button>
              </>
            ) : (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Payment unavailable
                </p>

                <h2 className="mt-2 text-xl font-bold text-slate-950">Payment unavailable</h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This special collection is {getStatusLabel(collection.status).toLowerCase()}. New
                  payments are not available.
                </p>
              </div>
            )}
          </section>
        )}

        {isSecretary && summary && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)] sm:p-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Collection summary
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-950">Payment progress</h2>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-400">Expected</p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {formatAmount(summary.expectedAmount)}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs text-emerald-600">Collected</p>

                <p className="mt-1 text-lg font-bold text-emerald-800">
                  {formatAmount(summary.collectedAmount)}
                </p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-xs text-amber-600">Pending</p>

                <p className="mt-1 text-lg font-bold text-amber-800">
                  {formatAmount(summary.pendingAmount)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-400">Progress</p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {Number(summary.progressPercentage || 0).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-400">Paid count</p>

                <p className="mt-1 text-sm font-bold text-slate-700">{summary.paidCount || 0}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Pending count</p>

                <p className="mt-1 text-sm font-bold text-slate-700">{summary.pendingCount || 0}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Overdue count</p>

                <p className="mt-1 text-sm font-bold text-slate-700">{summary.overdueCount || 0}</p>
              </div>
            </div>
          </section>
        )}

        {isSecretary && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)] sm:p-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Secretary controls
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-950">Manage collection</h2>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {collection.status === "DRAFT" && (
                <>
                  <Link
                    to={`/societies/${societyId}/special-collections/${collectionId}/edit`}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </Link>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      handleStatusChange("activate", "Collection activated successfully.")
                    }
                    className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {actionLoading ? "Updating..." : "Activate"}
                  </button>
                </>
              )}

              {collection.status === "ACTIVE" && (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleStatusChange("close", "Collection closed successfully.")}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {actionLoading ? "Updating..." : "Close Collection"}
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      handleStatusChange("cancel", "Collection cancelled successfully.")
                    }
                    className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    {actionLoading ? "Updating..." : "Cancel Collection"}
                  </button>

                  <button
                    type="button"
                    onClick={openOfflinePayment}
                    className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Record Offline Payment
                  </button>
                </>
              )}

              <Link
                to={`/societies/${societyId}/special-collections/${collectionId}/payments`}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                View Payments
              </Link>
            </div>
          </section>
        )}
      </div>

      {showOfflinePayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Offline payment
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-slate-950">Record Payment</h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Record a cash or other offline payment for this collection.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeOfflinePayment}
                  disabled={offlineSaving}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleOfflineSubmit} className="space-y-5 p-6 sm:p-8">
              {offlineError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-900">
                    Payment could not be recorded
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-700">{offlineError}</p>
                </div>
              )}

              {offlineSuccess && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-900">Payment successful</p>

                  <p className="mt-1 text-sm text-emerald-700">{offlineSuccess}</p>
                </div>
              )}

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-medium text-slate-400">Collection</p>

                <p className="mt-1 font-semibold text-slate-900">{collection.title}</p>

                <p className="mt-1 text-sm text-slate-500">
                  Amount: {formatAmount(collection.amount)}
                </p>
              </div>

              <div>
                <label
                  htmlFor="offline-resident"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Resident
                </label>

                {offlineLoading ? (
                  <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Loading residents...
                  </div>
                ) : (
                  <select
                    id="offline-resident"
                    name="residentId"
                    value={offlineForm.residentId}
                    onChange={handleOfflineResidentChange}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="">Select resident</option>

                    {offlineResidentOptions.map((payment) => {
                      const resident = payment.residentId;

                      const residentName = resident?.userId?.name || "Unknown Resident";

                      const flatNumber = payment.flatId?.flatNumber || "No Flat";

                      return (
                        <option key={resident?._id} value={resident?._id}>
                          {residentName} — Flat {flatNumber}
                        </option>
                      );
                    })}
                  </select>
                )}

                {!offlineLoading && offlineResidentOptions.length === 0 && (
                  <p className="mt-2 text-sm text-slate-500">
                    All applicable residents have already paid this collection.
                  </p>
                )}
              </div>

              {offlineForm.flatId && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-400">Flat</p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {offlinePayments.find(
                      (payment) =>
                        String(payment.residentId?._id) === String(offlineForm.residentId)
                    )?.flatId?.flatNumber || "—"}
                  </p>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="offline-amount"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Amount
                  </label>

                  <input
                    id="offline-amount"
                    type="number"
                    name="amount"
                    value={offlineForm.amount}
                    onChange={handleOfflineChange}
                    min="1"
                    required
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="offline-method"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Payment Method
                  </label>

                  <select
                    id="offline-method"
                    name="paymentMethod"
                    value={offlineForm.paymentMethod}
                    onChange={handleOfflineChange}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="CASH">Cash</option>

                    <option value="UPI">UPI</option>

                    <option value="BANK_TRANSFER">Bank Transfer</option>

                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="offline-date"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Payment Date
                  </label>

                  <input
                    id="offline-date"
                    type="date"
                    name="paymentDate"
                    value={offlineForm.paymentDate}
                    onChange={handleOfflineChange}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="offline-transaction"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Reference / Transaction ID
                  </label>

                  <input
                    id="offline-transaction"
                    type="text"
                    name="transactionId"
                    value={offlineForm.transactionId}
                    onChange={handleOfflineChange}
                    placeholder="Optional"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="offline-remarks"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Remarks
                </label>

                <textarea
                  id="offline-remarks"
                  name="remarks"
                  value={offlineForm.remarks}
                  onChange={handleOfflineChange}
                  rows="3"
                  placeholder="Optional remarks"
                  className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeOfflinePayment}
                  disabled={offlineSaving}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={offlineSaving || offlineLoading}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {offlineSaving ? "Recording Payment..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default SpecialCollectionDetailsPage;
