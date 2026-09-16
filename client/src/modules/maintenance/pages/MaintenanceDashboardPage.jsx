import { useEffect, useState } from "react";
import { useParams } from "react-router";
import AppShell from "../../../components/common/AppShell.jsx";

import {
  getMaintenanceDashboard,
  getSocietyBills,
  getSocietyPaymentHistory,
  generateMonthlyBills,
  updateMaintenanceBill,
  recordOfflineMaintenancePayment,
  markMaintenanceBillsOverdue
} from "../api/maintenance.api.js";

// =====================================================
// HELPERS
// =====================================================

const getCurrentMonth = () => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  return `${year}-${month}`;
};

const getBillId = (bill) => {
  return bill?._id || bill?.id || "";
};

const getFlatNumber = (bill) => {
  if (
    bill?.flatId &&
    typeof bill.flatId === "object"
  ) {
    return (
      bill.flatId.flatNumber ||
      "N/A"
    );
  }

  return (
    bill?.flatNumber ||
    "N/A"
  );
};

const getPaymentFlatNumber = (payment) => {
  if (
    payment?.flatId &&
    typeof payment.flatId === "object"
  ) {
    return (
      payment.flatId.flatNumber ||
      "N/A"
    );
  }

  return (
    payment?.flatNumber ||
    "N/A"
  );
};

const getPaymentMonth = (payment) => {
  if (
    payment?.billId &&
    typeof payment.billId === "object"
  ) {
    return (
      payment.billId.month ||
      "N/A"
    );
  }

  return (
    payment?.month ||
    "N/A"
  );
};

const formatAmount = (amount) => {
  return `₹${Number(
    amount || 0
  ).toLocaleString("en-IN")}`;
};

const formatDate = (date) => {
  if (!date) {
    return "N/A";
  }

  return new Date(
    date
  ).toLocaleDateString("en-IN");
};

const getStatusClasses = (status) => {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-700";

    case "OVERDUE":
      return "bg-red-100 text-red-700";

    default:
      return "bg-yellow-100 text-yellow-700";
  }
};

// =====================================================
// PAYMENT METHOD TOTALS
// =====================================================

const getPaymentMethodTotals = (payments) => {
  const totals = {
    RAZORPAY: 0,
    CASH: 0,
    UPI: 0,
    BANK_TRANSFER: 0
  };

  payments.forEach((payment) => {
    if (
      payment.status === "SUCCESS" &&
      totals[payment.paymentMethod] !== undefined
    ) {
      totals[payment.paymentMethod] +=
        Number(payment.amount || 0);
    }
  });

  return totals;
};

// =====================================================
// COMPONENT
// =====================================================

const MaintenanceDashboardPage = () => {
  const { societyId } = useParams();

  // ===================================================
  // BASIC STATE
  // ===================================================

  const [month, setMonth] =
    useState(getCurrentMonth());

  const [dashboard, setDashboard] =
    useState(null);

  const [bills, setBills] =
    useState([]);

  const [payments, setPayments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  // ===================================================
  // MODAL STATE
  // ===================================================

  const [
    showGenerateModal,
    setShowGenerateModal
  ] = useState(false);

  const [
    showEditModal,
    setShowEditModal
  ] = useState(false);

  const [
    showOfflineModal,
    setShowOfflineModal
  ] = useState(false);

  const [
    selectedBill,
    setSelectedBill
  ] = useState(null);

  // ===================================================
  // GENERATE FORM
  // ===================================================

  const [
    generateForm,
    setGenerateForm
  ] = useState({
    month: getCurrentMonth(),
    dueDate: "",
    defaultMaintenanceAmount: "",
    lateFee: ""
  });

  // ===================================================
  // EDIT FORM
  // ===================================================

  const [
    editForm,
    setEditForm
  ] = useState({
    maintenanceAmount: "",
    dueDate: "",
    lateFee: "",
    adjustmentReason: ""
  });

  // ===================================================
  // OFFLINE PAYMENT FORM
  // ===================================================

  const [
    offlineForm,
    setOfflineForm
  ] = useState({
    billId: "",
    amount: "",
    paymentMethod: "CASH",
    paymentDate: new Date()
      .toISOString()
      .split("T")[0],
    transactionId: ""
  });

  // ===================================================
  // REPORT CALCULATIONS
  // ===================================================

  const paymentMethodTotals =
    getPaymentMethodTotals(payments);

  const paidBills =
    bills.filter(
      (bill) =>
        bill.status === "PAID"
    ).length;

  const pendingBills =
    bills.filter(
      (bill) =>
        bill.status === "PENDING"
    ).length;

  const overdueBills =
    bills.filter(
      (bill) =>
        bill.status === "OVERDUE"
    ).length;

  const outstandingAmount =
    Number(
      dashboard?.pendingAmount || 0
    ) +
    Number(
      dashboard?.overdueAmount || 0
    );

  const successfulPayments =
    payments.filter(
      (payment) =>
        payment.status === "SUCCESS"
    ).length;

  // ===================================================
  // LOAD DASHBOARD
  // ===================================================

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const dashboardData =
        await getMaintenanceDashboard(
          societyId,
          month
        );

      const billsData =
        await getSocietyBills(
          societyId,
          month
        );

      const paymentsData =
        await getSocietyPaymentHistory(
          societyId,
          month
        );

      setDashboard(
        dashboardData
      );

      setBills(
        Array.isArray(billsData)
          ? billsData
          : []
      );

      setPayments(
        Array.isArray(paymentsData)
          ? paymentsData
          : []
      );

    } catch (err) {
      console.error(
        "Dashboard error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load maintenance dashboard"
      );

    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // LOAD WHEN SOCIETY OR MONTH CHANGES
  // ===================================================

  useEffect(() => {
    if (!societyId) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const dashboardData =
          await getMaintenanceDashboard(
            societyId,
            month
          );

        const billsData =
          await getSocietyBills(
            societyId,
            month
          );

        const paymentsData =
          await getSocietyPaymentHistory(
            societyId,
            month
          );

        if (cancelled) {
          return;
        }

        setDashboard(
          dashboardData
        );

        setBills(
          Array.isArray(billsData)
            ? billsData
            : []
        );

        setPayments(
          Array.isArray(paymentsData)
            ? paymentsData
            : []
        );

        setError("");

      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Dashboard error:",
          err
        );

        setError(
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load maintenance dashboard"
        );

      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };

  }, [
    societyId,
    month
  ]);

  // ===================================================
  // GENERATE BILLS
  // ===================================================

  const handleGenerateBills = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      await generateMonthlyBills(
        societyId,
        {
          month:
            generateForm.month,

          dueDate:
            generateForm.dueDate,

          defaultMaintenanceAmount:
            Number(
              generateForm
                .defaultMaintenanceAmount
            ),

          lateFee:
            Number(
              generateForm.lateFee ||
              0
            )
        }
      );

      setMessage(
        `Monthly bills generated successfully for ${generateForm.month}.`
      );

      setShowGenerateModal(false);

      setGenerateForm({
        month,
        dueDate: "",
        defaultMaintenanceAmount: "",
        lateFee: ""
      });

      await loadDashboard();

    } catch (err) {
      console.error(
        "Generate bills error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to generate bills"
      );
    }
  };

  // ===================================================
  // OPEN EDIT MODAL
  // ===================================================

  const openEditModal = (bill) => {
    setSelectedBill(bill);

    setEditForm({
      maintenanceAmount:
        bill?.maintenanceAmount ??
        "",

      dueDate:
        bill?.dueDate
          ? new Date(
              bill.dueDate
            )
              .toISOString()
              .split("T")[0]
          : "",

      lateFee:
        bill?.lateFee ??
        "",

      adjustmentReason:
        bill?.adjustmentReason ||
        ""
    });

    setShowEditModal(true);
  };

  // ===================================================
  // UPDATE BILL
  // ===================================================

  const handleUpdateBill = async (e) => {
    e.preventDefault();

    if (!selectedBill) {
      setError(
        "No bill selected."
      );

      return;
    }

    const billId =
      getBillId(selectedBill);

    if (!billId) {
      setError(
        "Bill ID is missing."
      );

      return;
    }

    // Adjustment reason is mandatory
    // whenever a bill is edited.
    if (
      !editForm.adjustmentReason.trim()
    ) {
      setError(
        "Adjustment reason is required when editing a maintenance bill."
      );

      return;
    }

    try {
      setError("");
      setMessage("");

      await updateMaintenanceBill(
        societyId,
        billId,
        {
          maintenanceAmount:
            Number(
              editForm
                .maintenanceAmount
            ),

          dueDate:
            editForm.dueDate,

          lateFee:
            Number(
              editForm.lateFee ||
              0
            ),

          adjustmentReason:
            editForm.adjustmentReason.trim()
        }
      );

      setMessage(
        "Maintenance bill updated successfully."
      );

      setShowEditModal(false);
      setSelectedBill(null);

      await loadDashboard();

    } catch (err) {
      console.error(
        "Update bill error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update bill"
      );
    }
  };

  // ===================================================
  // OPEN OFFLINE PAYMENT MODAL
  // ===================================================

  const openOfflinePaymentModal = (
    bill = null
  ) => {
    setSelectedBill(bill);

    setOfflineForm({
      billId:
        bill
          ? getBillId(bill)
          : "",

      amount:
        bill
          ? bill.totalAmount
          : "",

      paymentMethod:
        "CASH",

      paymentDate:
        new Date()
          .toISOString()
          .split("T")[0],

      transactionId:
        ""
    });

    setShowOfflineModal(true);
  };

  // ===================================================
  // RECORD OFFLINE PAYMENT
  // ===================================================

  const handleOfflinePayment =
    async (e) => {
      e.preventDefault();

      if (
        !offlineForm.billId
      ) {
        setError(
          "Please select a bill."
        );

        return;
      }

      try {
        setError("");
        setMessage("");

        await recordOfflineMaintenancePayment(
          societyId,
          {
            billId:
              offlineForm.billId,

            amount:
              Number(
                offlineForm.amount
              ),

            paymentMethod:
              offlineForm.paymentMethod,

            paymentDate:
              offlineForm.paymentDate,

            transactionId:
              offlineForm.transactionId
          }
        );

        setMessage(
          "Offline payment recorded successfully."
        );

        setShowOfflineModal(false);
        setSelectedBill(null);

        await loadDashboard();

      } catch (err) {
        console.error(
          "Offline payment error:",
          err
        );

        setError(
          err?.response?.data?.message ||
          err?.message ||
          "Failed to record offline payment"
        );
      }
    };

  // ===================================================
  // MARK OVERDUE
  // ===================================================

  const handleMarkOverdue =
    async () => {
      try {
        setError("");
        setMessage("");

        const result =
          await markMaintenanceBillsOverdue(
            societyId,
            month
          );

        if (
          result?.updatedCount === 0
        ) {
          setMessage(
            `No bills were marked overdue for ${month}.`
          );
        } else if (
          result?.updatedCount === 1
        ) {
          setMessage(
            `1 bill was marked overdue for ${month}.`
          );
        } else {
          setMessage(
            `${result.updatedCount} bills were marked overdue for ${month}.`
          );
        }

        await loadDashboard();

      } catch (err) {
        console.error(
          "Mark overdue error:",
          err
        );

        setMessage("");

        setError(
          err?.response?.data?.message ||
          err?.message ||
          "Failed to mark overdue bills"
        );
      }
    };

  // ===================================================
  // LOADING SCREEN
  // ===================================================

  if (loading) {
    return (
      <AppShell
        title="Maintenance Dashboard"
        description="Manage society maintenance bills and payments."
        backTo={`/societies/${societyId}/dashboard`}
      >
        <div className="flex min-h-[300px] items-center justify-center">

          <div className="text-center">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

            <p className="mt-4 text-sm text-slate-500">
              Loading maintenance dashboard...
            </p>

          </div>

        </div>
      </AppShell>
    );
  }

  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <AppShell
      title="Maintenance Dashboard"
      description="Manage society maintenance bills and payments."
      backTo={`/societies/${societyId}/dashboard`}
    >

      <div className="space-y-8">

        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {message && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {/* =================================================
            ERROR MESSAGE
        ================================================= */}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            MONTH SELECTOR
        ================================================= */}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Billing Period
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-950">
                Select Month
              </h2>
            </div>

            <input
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(
                  e.target.value
                );

                setMessage("");
                setError("");
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
            />

          </div>

        </section>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <section>

          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Overview
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Maintenance Collection
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {/* EXPECTED */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">

              <p className="text-sm font-medium text-slate-500">
                Expected Amount
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {formatAmount(
                  dashboard?.expectedAmount
                )}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {dashboard?.totalFlats || 0} flats
              </p>

            </div>

            {/* COLLECTED */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">

              <p className="text-sm font-medium text-slate-500">
                Collected
              </p>

              <h2 className="mt-2 text-2xl font-bold text-green-600">
                {formatAmount(
                  dashboard?.collectedAmount
                )}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {dashboard?.paidCount || 0} paid
              </p>

            </div>

            {/* PENDING */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">

              <p className="text-sm font-medium text-slate-500">
                Pending
              </p>

              <h2 className="mt-2 text-2xl font-bold text-yellow-600">
                {formatAmount(
                  dashboard?.pendingAmount
                )}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {dashboard?.pendingCount || 0} pending
              </p>

            </div>

            {/* OVERDUE */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">

              <p className="text-sm font-medium text-slate-500">
                Overdue
              </p>

              <h2 className="mt-2 text-2xl font-bold text-red-600">
                {formatAmount(
                  dashboard?.overdueAmount
                )}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {dashboard?.overdueCount || 0} overdue
              </p>

            </div>

          </div>

        </section>

        {/* =================================================
            MONTHLY BILLS
        ================================================= */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">

          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Billing
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-950">
                Monthly Bills
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Bills for {month}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <button
                onClick={
                  handleMarkOverdue
                }
                className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Mark Overdue
              </button>

              <button
                onClick={() => {
                  setGenerateForm({
                    month,
                    dueDate: "",
                    defaultMaintenanceAmount: "",
                    lateFee: ""
                  });

                  setShowGenerateModal(
                    true
                  );
                }}
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Generate Bills
              </button>

            </div>

          </div>

          {/* BILLS TABLE */}

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="bg-slate-50">

                <tr>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Flat
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Maintenance
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Late Fee
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Due Date
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  {/* NEW */}
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Adjustment Reason
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-200">

                {bills.length === 0 ? (

                  <tr>

                    <td
                      colSpan="8"
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      No bills found for {month}.
                    </td>

                  </tr>

                ) : (

                  bills.map(
                    (bill) => {

                      const billId =
                        getBillId(
                          bill
                        );

                      return (

                        <tr
                          key={billId}
                          className="transition hover:bg-slate-50"
                        >

                          <td className="px-5 py-4 font-semibold text-slate-900">
                            {getFlatNumber(
                              bill
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {formatAmount(
                              bill.maintenanceAmount
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {formatAmount(
                              bill.lateFee
                            )}
                          </td>

                          <td className="px-5 py-4 font-bold text-slate-900">
                            {formatAmount(
                              bill.totalAmount
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {formatDate(
                              bill.dueDate
                            )}
                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                bill.status
                              )}`}
                            >
                              {bill.status}
                            </span>

                          </td>

                          {/* NEW */}
                          <td className="max-w-xs px-5 py-4 text-sm text-slate-700">
                            {bill.adjustmentReason ||
                              "No adjustment"}
                          </td>

                          <td className="px-5 py-4">

                            <div className="flex flex-wrap gap-2">

                              {bill.status !==
                                "PAID" && (

                                <button
                                  onClick={() =>
                                    openEditModal(
                                      bill
                                    )
                                  }
                                  className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                                >
                                  Edit
                                </button>

                              )}

                              {bill.status !==
                                "PAID" && (

                                <button
                                  onClick={() =>
                                    openOfflinePaymentModal(
                                      bill
                                    )
                                  }
                                  className="rounded-lg border border-green-200 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50"
                                >
                                  Record Payment
                                </button>

                              )}

                            </div>

                          </td>

                        </tr>

                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>
                {/* =================================================
            REPORTS
        ================================================= */}

        <section>

          <div className="mb-4">

            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Analytics
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Reports
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Maintenance report for {month}
            </p>

          </div>

          {/* COLLECTION SUMMARY */}

          <div className="mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">

              <p className="text-sm text-slate-500">
                Expected Collection
              </p>

              <h3 className="mt-2 text-2xl font-bold text-slate-950">
                {formatAmount(
                  dashboard?.expectedAmount
                )}
              </h3>

            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">

              <p className="text-sm text-slate-500">
                Collected
              </p>

              <h3 className="mt-2 text-2xl font-bold text-green-600">
                {formatAmount(
                  dashboard?.collectedAmount
                )}
              </h3>

            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">

              <p className="text-sm text-slate-500">
                Outstanding
              </p>

              <h3 className="mt-2 text-2xl font-bold text-orange-600">
                {formatAmount(
                  outstandingAmount
                )}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Pending + Overdue
              </p>

            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">

              <p className="text-sm text-slate-500">
                Successful Payments
              </p>

              <h3 className="mt-2 text-2xl font-bold text-blue-600">
                {successfulPayments}
              </h3>

            </div>

          </div>

          {/* BILL STATUS + PAYMENT METHODS */}

          <div className="grid gap-6 lg:grid-cols-2">

            {/* BILL STATUS */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">

              <h3 className="mb-5 text-lg font-bold text-slate-950">
                Bill Status
              </h3>

              <div className="space-y-4">

                <div className="flex items-center justify-between">

                  <span className="text-slate-600">
                    Paid Bills
                  </span>

                  <span className="font-semibold text-green-600">
                    {paidBills}
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span className="text-slate-600">
                    Pending Bills
                  </span>

                  <span className="font-semibold text-yellow-600">
                    {pendingBills}
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span className="text-slate-600">
                    Overdue Bills
                  </span>

                  <span className="font-semibold text-red-600">
                    {overdueBills}
                  </span>

                </div>

                <div className="border-t border-slate-100 pt-4">

                  <div className="flex items-center justify-between">

                    <span className="font-semibold text-slate-900">
                      Total Bills
                    </span>

                    <span className="font-bold text-slate-950">
                      {bills.length}
                    </span>

                  </div>

                </div>

              </div>

            </div>

            {/* PAYMENT METHODS */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">

              <h3 className="mb-5 text-lg font-bold text-slate-950">
                Collection by Payment Method
              </h3>

              <div className="space-y-4">

                <div className="flex items-center justify-between">

                  <span className="text-slate-600">
                    Razorpay
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatAmount(
                      paymentMethodTotals.RAZORPAY
                    )}
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span className="text-slate-600">
                    Cash
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatAmount(
                      paymentMethodTotals.CASH
                    )}
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span className="text-slate-600">
                    UPI
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatAmount(
                      paymentMethodTotals.UPI
                    )}
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span className="text-slate-600">
                    Bank Transfer
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatAmount(
                      paymentMethodTotals.BANK_TRANSFER
                    )}
                  </span>

                </div>

                <div className="border-t border-slate-100 pt-4">

                  <div className="flex items-center justify-between">

                    <span className="font-semibold text-slate-900">
                      Total Collected
                    </span>

                    <span className="font-bold text-green-600">
                      {formatAmount(
                        dashboard?.collectedAmount
                      )}
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            PAYMENT HISTORY
        ================================================= */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">

          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Transactions
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-950">
                Payment History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Society-wide payments for {month}
              </p>

            </div>

            <button
              onClick={() =>
                openOfflinePaymentModal()
              }
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Record Offline Payment
            </button>

          </div>

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="bg-slate-50">

                <tr>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Flat
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Month
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Method
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Receipt
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-200">

                {payments.length === 0 ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      No payments found for {month}.
                    </td>

                  </tr>

                ) : (

                  payments.map(
                    (payment) => (

                      <tr
                        key={
                          payment?._id ||
                          payment?.id
                        }
                        className="hover:bg-slate-50"
                      >

                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {getPaymentFlatNumber(
                            payment
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {getPaymentMonth(
                            payment
                          )}
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {formatAmount(
                            payment.amount
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {payment.paymentMethod ||
                            "N/A"}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {formatDate(
                            payment.paymentDate
                          )}
                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              payment.status ===
                              "SUCCESS"
                                ? "bg-green-100 text-green-700"
                                : payment.status ===
                                  "FAILED"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {payment.status}
                          </span>

                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {payment.receiptNumber ||
                            "—"}
                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>


      {/* ===================================================
          GENERATE BILLS MODAL
      =================================================== */}

      {showGenerateModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-xl font-semibold text-gray-900">
                Generate Monthly Bills
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowGenerateModal(
                    false
                  )
                }
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleGenerateBills
              }
              className="space-y-4"
            >

              <div>

                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Month
                </label>

                <input
                  type="month"
                  required
                  value={
                    generateForm.month
                  }
                  onChange={(e) =>
                    setGenerateForm({
                      ...generateForm,
                      month:
                        e.target.value
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Due Date
                </label>

                <input
                  type="date"
                  required
                  value={
                    generateForm.dueDate
                  }
                  onChange={(e) =>
                    setGenerateForm({
                      ...generateForm,
                      dueDate:
                        e.target.value
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Default Maintenance Amount
                </label>

                <input
                  type="number"
                  min="0"
                  required
                  value={
                    generateForm
                      .defaultMaintenanceAmount
                  }
                  onChange={(e) =>
                    setGenerateForm({
                      ...generateForm,
                      defaultMaintenanceAmount:
                        e.target.value
                    })
                  }
                  placeholder="2500"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Late Fee
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    generateForm.lateFee
                  }
                  onChange={(e) =>
                    setGenerateForm({
                      ...generateForm,
                      lateFee:
                        e.target.value
                    })
                  }
                  placeholder="100"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />

              </div>

              <div className="flex justify-end gap-3 pt-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowGenerateModal(
                      false
                    )
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Generate
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ===================================================
          EDIT BILL MODAL
      =================================================== */}

      {showEditModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">

            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-xl font-semibold text-gray-900">
                Edit Maintenance Bill
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowEditModal(
                    false
                  )
                }
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleUpdateBill
              }
              className="space-y-4"
            >

              <div>

                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Maintenance Amount
                </label>

                <input
                  type="number"
                  min="0"
                  required
                  value={
                    editForm
                      .maintenanceAmount
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      maintenanceAmount:
                        e.target.value
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Due Date
                </label>

                <input
                  type="date"
                  required
                  value={
                    editForm.dueDate
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      dueDate:
                        e.target.value
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Late Fee
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    editForm.lateFee
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      lateFee:
                        e.target.value
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Adjustment Reason
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <textarea
                  rows="3"
                  required
                  value={
                    editForm
                      .adjustmentReason
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      adjustmentReason:
                        e.target.value
                    })
                  }
                  placeholder="Reason for changing the bill"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Adjustment reason is required when editing a bill.
                </p>

              </div>

              <div className="flex justify-end gap-3 pt-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowEditModal(
                      false
                    )
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Save Changes
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ===================================================
          OFFLINE PAYMENT MODAL
      =================================================== */}

      {showOfflineModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">

            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-xl font-semibold text-gray-900">
                Record Offline Payment
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowOfflineModal(
                    false
                  )
                }
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleOfflinePayment
              }
              className="space-y-4"
            >

              <div>

                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Bill
                </label>

                <select
                  required
                  value={
                    offlineForm.billId
                  }
                  onChange={(e) => {

                    const selectedBill =
                      bills.find(
                        (bill) =>
                          getBillId(
                            bill
                          ) ===
                          e.target.value
                      );

                    setOfflineForm({
                      ...offlineForm,

                      billId:
                        e.target.value,

                      amount:
                        selectedBill
                          ? selectedBill.totalAmount
                          : offlineForm.amount
                    });

                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                >

                  <option value="">
                    Select Bill
                  </option>

                  {bills
                    .filter(
                      (bill) =>
                        bill.status !==
                        "PAID"
                    )
                    .map(
                      (bill) => (

                        <option
                          key={
                            getBillId(
                              bill
                            )
                          }
                          value={
                            getBillId(
                              bill
                            )
                          }
                        >
                          {getFlatNumber(
                            bill
                          )}{" "}
                          -{" "}
                          {formatAmount(
                            bill.totalAmount
                          )}
                        </option>

                      )
                    )}

                </select>

              </div>

              <div>

                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Amount
                </label>

                <input
                  type="number"
                  min="0"
                  required
                  value={
                    offlineForm.amount
                  }
                  onChange={(e) =>
                    setOfflineForm({
                      ...offlineForm,
                      amount:
                        e.target.value
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Payment Method
                </label>

                <select
                  value={
                    offlineForm.paymentMethod
                  }
                  onChange={(e) =>
                    setOfflineForm({
                      ...offlineForm,
                      paymentMethod:
                        e.target.value
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                >

                  <option value="CASH">
                    Cash
                  </option>

                  <option value="UPI">
                    UPI
                  </option>

                  <option value="BANK_TRANSFER">
                    Bank Transfer
                  </option>

                </select>

              </div>

              <div>

                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Payment Date
                </label>

                <input
                  type="date"
                  required
                  value={
                    offlineForm.paymentDate
                  }
                  onChange={(e) =>
                    setOfflineForm({
                      ...offlineForm,
                      paymentDate:
                        e.target.value
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Transaction ID
                </label>

                <input
                  type="text"
                  value={
                    offlineForm.transactionId
                  }
                  onChange={(e) =>
                    setOfflineForm({
                      ...offlineForm,
                      transactionId:
                        e.target.value
                    })
                  }
                  placeholder="Optional"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />

              </div>

              <div className="flex justify-end gap-3 pt-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowOfflineModal(
                      false
                    )
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Record Payment
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </AppShell>
  );
};

export default MaintenanceDashboardPage;