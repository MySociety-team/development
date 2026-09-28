import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { getSociety } from "../../societies/api/society.api.js";

import { getSpecialCollections } from "../api/specialCollection.api.js";

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

function getStatusLabel(status) {
  switch (status) {
    case "DRAFT":
      return "Draft";

    case "ACTIVE":
      return "Active";

    case "CLOSED":
      return "Closed";

    case "CANCELLED":
      return "Cancelled";

    default:
      return status || "Unknown";
  }
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

function SpecialCollectionsPage() {
  const { societyId } = useParams();

  const [collections, setCollections] = useState([]);
  const [membership, setMembership] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadCollections = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [collectionData, societyData] = await Promise.all([
          getSpecialCollections(societyId),
          getSociety(societyId)
        ]);

        if (!cancelled) {
          setCollections(Array.isArray(collectionData) ? collectionData : []);
          setMembership(societyData?.membership || null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getApiErrorMessage(error, "Unable to load special collections."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCollections();

    return () => {
      cancelled = true;
    };
  }, [societyId]);

  const isSecretary = membership?.role === "SECRETARY";

  if (loading) {
    return (
      <AppShell
        title="Special Collections"
        description="One-time and purpose-specific society payments."
        backTo={`/societies/${societyId}/dashboard`}
      >
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse space-y-5">
            <div className="h-32 rounded-3xl bg-slate-200" />
            <div className="h-40 rounded-3xl bg-slate-200" />
            <div className="h-40 rounded-3xl bg-slate-200" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Special Collections"
      description="One-time and purpose-specific society payments."
      backTo={`/societies/${societyId}/dashboard`}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Society payments
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              Special Collections
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              One-time collections for events, repairs, building work, and other society purposes.
            </p>
          </div>

          {isSecretary && (
            <Link
              to={`/societies/${societyId}/special-collections/create`}
              className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + Create Collection
            </Link>
          )}
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
                !
              </div>

              <div>
                <p className="text-sm font-semibold text-red-900">Something went wrong</p>

                <p className="mt-1 text-sm leading-6 text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!errorMessage && collections.length === 0 && (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              ₹
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-950">No special collections</h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              There are currently no special collections available for this society.
            </p>

            {isSecretary && (
              <Link
                to={`/societies/${societyId}/special-collections/create`}
                className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Create first collection
              </Link>
            )}
          </section>
        )}

        {/* Collection List */}
        <div className="space-y-5">
          {collections.map((collection) => (
            <article
              key={collection._id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]"
            >
              <div className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
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

                    <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-950">
                      {collection.title}
                    </h2>

                    {collection.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                        {collection.description}
                      </p>
                    )}
                  </div>

                  <Link
                    to={`/societies/${societyId}/special-collections/${collection._id}`}
                    className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View details
                  </Link>
                </div>

                <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Amount</p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatAmount(collection.amount)}
                    </p>
                  </div>

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

                {isSecretary && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <Link
                      to={`/societies/${societyId}/special-collections/${collection._id}`}
                      className="text-sm font-semibold text-slate-700 hover:text-slate-950"
                    >
                      Manage collection →
                    </Link>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export default SpecialCollectionsPage;
