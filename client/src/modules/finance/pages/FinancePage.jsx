import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { getSociety } from "../../societies/api/society.api.js";

import {
  createFinanceRecord,
  deleteFinanceRecord,
  getFinanceRecords,
  getFinanceSummary,
  updateFinanceRecord
} from "../api/finance.api.js";

const initialForm = {
  title: "",
  description: "",
  amount: "",
  type: "INCOME",
  category: "",
  date: new Date().toISOString().split("T")[0],
  paymentMethod: "UPI",
  documentUrl: ""
};

const incomeCategories = ["Society Fund", "Donation", "Other Income"];

const expenseCategories = [
  "Electricity",
  "Water",
  "Lift Maintenance",
  "Repairs",
  "Cleaning",
  "Gardening",
  "Staff",
  "Other"
];

const paymentMethods = ["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"];

const formatAmount = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(Number(amount || 0));

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(date));

function FinancePage() {
  const { societyId } = useParams();

  const [societyData, setSocietyData] = useState(null);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    currentBalance: 0
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [deleteRecord, setDeleteRecord] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);

  const isSecretary = societyData?.membership?.role === "SECRETARY";

  const categories = useMemo(() => {
    return form.type === "INCOME" ? incomeCategories : expenseCategories;
  }, [form.type]);

  const refreshFinance = useCallback(async () => {
    const [financeRecords, financeSummary] = await Promise.all([
      getFinanceRecords(societyId, {
        type: typeFilter,
        category: categoryFilter,
        search
      }),
      getFinanceSummary(societyId)
    ]);

    setRecords(financeRecords);
    setSummary(financeSummary);
  }, [societyId, typeFilter, categoryFilter, search]);

  useEffect(() => {
    let cancelled = false;

    const loadFinance = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const [society, financeRecords, financeSummary] = await Promise.all([
          getSociety(societyId),
          getFinanceRecords(societyId, {
            type: typeFilter,
            category: categoryFilter,
            search
          }),
          getFinanceSummary(societyId)
        ]);

        if (cancelled) {
          return;
        }

        setSocietyData(society);
        setRecords(financeRecords);
        setSummary(financeSummary);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getApiErrorMessage(error, "Unable to load finance records."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFinance();

    return () => {
      cancelled = true;
    };
  }, [societyId, typeFilter, categoryFilter, search]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingRecord(null);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setActionLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (editingRecord) {
        await updateFinanceRecord(societyId, editingRecord._id, form);

        setSuccessMessage("Finance record updated successfully.");
      } else {
        await createFinanceRecord(societyId, form);

        setSuccessMessage("Finance record added successfully.");
      }

      resetForm();
      await refreshFinance();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to save finance record."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);

    setForm({
      title: record.title || "",
      description: record.description || "",
      amount: record.amount || "",
      type: record.type || "INCOME",
      category: record.category || "",
      date: record.date ? new Date(record.date).toISOString().split("T")[0] : "",
      paymentMethod: record.paymentMethod || "UPI",
      documentUrl: record.documentUrl || ""
    });

    setShowForm(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const openDeleteDialog = (record) => {
    setDeleteRecord(record);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const closeDeleteDialog = () => {
    if (!actionLoading) {
      setDeleteRecord(null);
    }
  };

  const openDocumentPreview = (record) => {
    setPreviewDocument(record);
  };

  const closeDocumentPreview = () => {
    setPreviewDocument(null);
  };

  const handleDelete = async () => {
    if (!deleteRecord) {
      return;
    }

    setActionLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteFinanceRecord(societyId, deleteRecord._id);

      setDeleteRecord(null);

      setSuccessMessage("Finance record deleted successfully.");

      await refreshFinance();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to delete finance record."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddRecord = () => {
    setEditingRecord(null);
    setForm(initialForm);
    setShowForm(true);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleTypeChange = (event) => {
    setForm((current) => ({
      ...current,
      type: event.target.value,
      category: ""
    }));
  };

  if (loading && !societyData) {
    return (
      <AppShell
        title="Finance"
        description="Society income and expenses"
        backTo={`/societies/${societyId}/dashboard`}
      >
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="h-8 w-48 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-80 max-w-full rounded bg-slate-100" />

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <div className="h-28 rounded-2xl bg-slate-100" />
              <div className="h-28 rounded-2xl bg-slate-100" />
              <div className="h-28 rounded-2xl bg-slate-100" />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Finance"
      description={
        societyData?.society?.name
          ? `${societyData.society.name} financial records`
          : "Society income and expenses"
      }
      backTo={`/societies/${societyId}/dashboard`}
    >
      <div className="mx-auto max-w-6xl space-y-7">
        {/* HEADER */}

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Society finances
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Finance Management
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Track society income, expenses, transactions, and current funds.
              </p>
            </div>

            {isSecretary && (
              <button
                type="button"
                onClick={handleAddRecord}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                + Add Transaction
              </button>
            )}
          </div>
        </section>

        {/* MESSAGES */}

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {/* SUMMARY */}

        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Total Income
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-950">
              {formatAmount(summary.totalIncome)}
            </p>

            <p className="mt-2 text-sm text-slate-500">Money received by the society</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Total Expenses
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-950">
              {formatAmount(summary.totalExpenses)}
            </p>

            <p className="mt-2 text-sm text-slate-500">Money spent by the society</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Current Balance
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-950">
              {formatAmount(summary.currentBalance)}
            </p>

            <p className="mt-2 text-sm text-slate-500">Income minus expenses</p>
          </div>
        </section>

        {/* FORM */}

        {showForm && isSecretary && (
          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Secretary
                </p>

                <h2 className="mt-2 text-xl font-bold text-slate-950">
                  {editingRecord ? "Edit Transaction" : "Add Transaction"}
                </h2>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-semibold text-slate-500 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">Title</label>

                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="e.g. Society Donation"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Amount</label>

                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={handleFormChange}
                  placeholder="Enter amount"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Type</label>

                <select
                  name="type"
                  value={form.type}
                  onChange={handleTypeChange}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Category</label>

                <select
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                >
                  <option value="">Select category</option>

                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Date</label>

                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleFormChange}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Payment Method</label>

                <select
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleFormChange}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Description</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Optional description"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Document URL</label>

                <input
                  name="documentUrl"
                  type="url"
                  value={form.documentUrl}
                  onChange={handleFormChange}
                  placeholder="Optional receipt/document URL"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </div>

              <div className="flex gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading
                    ? "Saving..."
                    : editingRecord
                      ? "Update Transaction"
                      : "Add Transaction"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* FILTERS */}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_180px_180px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search transactions..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
            />

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
            >
              <option value="">All types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
            >
              <option value="">All categories</option>

              {[...incomeCategories, ...expenseCategories]
                .filter((category, index, array) => array.indexOf(category) === index)
                .map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
            </select>
          </div>
        </section>

        {/* TRANSACTIONS */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-7 py-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Transaction history
            </p>

            <div className="mt-2 flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-950">Recent Transactions</h2>

              <span className="text-sm text-slate-500">
                {records.length} record
                {records.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {records.length === 0 ? (
            <div className="px-7 py-12 text-center">
              <p className="text-sm font-semibold text-slate-700">No finance records found.</p>

              <p className="mt-1 text-sm text-slate-500">
                {isSecretary
                  ? "Add an income or expense transaction to get started."
                  : "There are currently no finance records for this society."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {records.map((record) => (
                <div key={record._id} className="px-7 py-6 transition hover:bg-slate-50">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-950">{record.title}</h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            record.type === "INCOME"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {record.type}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        {record.description || "No description provided."}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                        <span>
                          Category: <strong className="text-slate-700">{record.category}</strong>
                        </span>

                        <span>
                          Payment:{" "}
                          <strong className="text-slate-700">
                            {record.paymentMethod.replaceAll("_", " ")}
                          </strong>
                        </span>

                        <span>{formatDate(record.date)}</span>
                        {record.documentUrl && (
                          <button
                            type="button"
                            onClick={() => openDocumentPreview(record)}
                            className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-950"
                          >
                            View Document
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                      <p
                        className={`text-lg font-bold ${
                          record.type === "INCOME" ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {record.type === "INCOME" ? "+" : "-"}
                        {formatAmount(record.amount)}
                      </p>

                      {isSecretary && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(record)}
                            disabled={actionLoading}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteDialog(record)}
                            disabled={actionLoading}
                            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FOOTER */}

        <div className="text-sm text-slate-500">
          <Link
            to={`/societies/${societyId}/dashboard`}
            className="font-semibold text-slate-700 hover:text-slate-950"
          >
            ← Back to society dashboard
          </Link>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}

      {deleteRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteDialog();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-finance-title"
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                  />
                </svg>
              </div>

              <div className="min-w-0">
                <h2 id="delete-finance-title" className="text-xl font-bold text-slate-950">
                  Delete Transaction?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Are you sure you want to delete this finance record? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {deleteRecord.title}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {deleteRecord.type} · {deleteRecord.category}
                  </p>
                </div>

                <p
                  className={`shrink-0 text-sm font-bold ${
                    deleteRecord.type === "INCOME" ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {deleteRecord.type === "INCOME" ? "+" : "-"}
                  {formatAmount(deleteRecord.amount)}
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={actionLoading}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? "Deleting..." : "Delete Transaction"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}

      {previewDocument && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDocumentPreview();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-preview-title"
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Finance Document
                </p>

                <h2
                  id="document-preview-title"
                  className="mt-1 truncate text-lg font-bold text-slate-950"
                >
                  {previewDocument.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDocumentPreview}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close document preview"
              >
                ×
              </button>
            </div>

            {/* IMAGE */}

            <div className="flex min-h-[300px] items-center justify-center overflow-auto bg-slate-100 p-6">
              <img
                src={previewDocument.documentUrl}
                alt={`${previewDocument.title} document`}
                className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-lg"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>

            {/* FOOTER */}

            <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDocumentPreview}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>

              <a
                href={previewDocument.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open in New Tab ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default FinancePage;
