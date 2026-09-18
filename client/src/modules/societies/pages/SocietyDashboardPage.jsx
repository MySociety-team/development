import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { getSociety } from "../api/society.api.js";

function SocietyDashboardPage() {
  const { societyId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSociety = async () => {
      try {
        const societyData = await getSociety(societyId);

        if (!cancelled) {
          setData(societyData);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getApiErrorMessage(error, "Unable to load the society."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSociety();

    return () => {
      cancelled = true;
    };
  }, [societyId]);

  const handleCopyCode = async () => {
    if (!data?.society?.joiningCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(data.society.joiningCode);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy joining code:", err);
    }
  };

  if (loading) {
    return (
      <AppShell title="Society dashboard" backTo="/societies">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.25)]">
            <div className="h-4 w-28 rounded-full bg-slate-200" />

            <div className="mt-4 h-8 w-64 rounded-lg bg-slate-200" />

            <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-100" />

            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              <div className="h-24 rounded-2xl bg-slate-100" />
              <div className="h-24 rounded-2xl bg-slate-100" />
              <div className="h-24 rounded-2xl bg-slate-100" />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (errorMessage || !data) {
    return (
      <AppShell title="Society dashboard" backTo="/societies">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
                !
              </div>

              <div>
                <h2 className="font-semibold text-red-900">Unable to load society</h2>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  {errorMessage || "Society could not be loaded."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const { society, membership } = data;

  const isSecretary = membership?.role === "SECRETARY";

  return (
    <AppShell title={society.name} description={society.address} backTo="/societies">
      <div className="mx-auto max-w-6xl space-y-7">
        {/* =====================================================
            SOCIETY HEADER
        ===================================================== */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-32px_rgba(15,23,42,0.3)]">
          <div className="border-b border-slate-100 px-7 py-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Society
                </p>

                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                  {society.name}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">{society.address}</p>
              </div>

              <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Your role
                </p>

                <p className="mt-1 text-sm font-bold">{membership.role}</p>
              </div>
            </div>
          </div>

          {/* Quick information */}
          <div className="grid gap-px bg-slate-100 sm:grid-cols-3">
            <div className="bg-white px-7 py-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Your flat
              </p>

              <p className="mt-2 text-xl font-bold text-slate-950">
                {membership.flat?.wing} {membership.flat?.flatNumber}
              </p>

              <p className="mt-1 text-xs text-slate-500">{membership.flat?.flatType}</p>
            </div>

            <div className="bg-white px-7 py-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Member type
              </p>

              <p className="mt-2 text-xl font-bold text-slate-950">{membership.memberType}</p>

              <p className="mt-1 text-xs text-slate-500">Current membership</p>
            </div>

            <div className="bg-white px-7 py-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Total flats
              </p>

              <p className="mt-2 text-xl font-bold text-slate-950">{society.numberOfFlats}</p>

              <p className="mt-1 text-xs text-slate-500">Registered in society</p>
            </div>
          </div>
        </section>

        {/* =====================================================
            JOINING CODE + FLAT DETAILS
        ===================================================== */}

        <div className="grid gap-7 lg:grid-cols-[1.35fr_0.65fr]">
          {/* Joining code */}
          <section className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">
            <div className="border-b border-slate-100 px-7 py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Resident access
                  </p>

                  <h2 className="mt-2 text-lg font-bold text-slate-950">Society joining code</h2>

                  <p className="mt-1.5 text-sm leading-6 text-slate-500">
                    Share this code with authenticated residents who need to join this society.
                  </p>
                </div>

                <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 sm:flex">
                  #
                </div>
              </div>
            </div>

            <div className="flex flex-1 items-center p-7">
              <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-8 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Joining code
                </p>

                <div className="mt-3 flex items-center justify-center gap-3">
                  <p className="pl-4 font-mono text-3xl font-bold tracking-[0.22em] text-slate-950 sm:text-4xl">
                    {society.joiningCode}
                  </p>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-slate-900 hover:shadow"
                    title="Copy Joining Code"
                  >
                    {copied ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 00-2-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                <p className="mt-4 text-xs text-slate-500">
                  {copied ? (
                    <span className="font-semibold text-emerald-600">Copied to clipboard!</span>
                  ) : (
                    "Residents can use this code from the Join Society page."
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* Your flat */}
          <section className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Your flat
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-950">
                {membership.flat?.wing} {membership.flat?.flatNumber}
              </h2>

              <p className="mt-1 text-sm text-slate-500">{membership.flat?.flatType}</p>
            </div>

            <dl className="mt-6 divide-y divide-slate-100 border-y border-slate-100">
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-sm text-slate-500">Floor</dt>

                <dd className="text-sm font-semibold text-slate-900">{membership.flat?.floor}</dd>
              </div>

              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-sm text-slate-500">Type</dt>

                <dd className="text-sm font-semibold text-slate-900">
                  {membership.flat?.flatType}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-sm text-slate-500">Member type</dt>

                <dd className="text-sm font-semibold text-slate-900">{membership.memberType}</dd>
              </div>

              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-sm text-slate-500">Mobile</dt>

                <dd className="text-sm font-semibold text-slate-900">
                  {membership.mobileNumber || "—"}
                </dd>
              </div>
            </dl>

            {/* Facilities */}
            <div className="mt-7 border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Facilities</h3>

                  <p className="mt-1 text-xs text-slate-500">Available amenities in the society.</p>
                </div>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {society.facilities?.length || 0}
                </span>
              </div>

              {!society.facilities || society.facilities.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  No facilities have been added.
                </div>
              ) : (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {society.facilities.map((facility) => (
                    <div
                      key={facility}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-700">
                        ✓
                      </span>

                      <span>{facility.replaceAll("_", " ")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* =====================================================
            MAIN FEATURE GRID
        ===================================================== */}

        <div className="grid gap-6 md:grid-cols-2">
          {/* =================================================
              MAINTENANCE - SECRETARY MANAGEMENT
          ================================================= */}

          {isSecretary && (
            <Link
              to={`/societies/${society.id}/maintenance/dashboard`}
              className="group flex h-full min-h-[230px] flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_50px_-25px_rgba(15,23,42,0.35)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Secretary
                  </p>

                  <h2 className="mt-2 text-lg font-bold text-slate-950">Manage Maintenance</h2>
                </div>

                <span className="text-xl text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-900">
                  →
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Generate bills, manage payments, mark overdue bills, and view maintenance reports.
              </p>

              <div className="mt-auto pt-6 text-sm font-semibold text-slate-900">
                Open Dashboard
                <span className="ml-1">→</span>
              </div>
            </Link>
          )}

          {/* =================================================
              MY MAINTENANCE
          ================================================= */}

          <Link
            to={`/societies/${society.id}/maintenance`}
            className="group flex h-full min-h-[230px] flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_50px_-25px_rgba(15,23,42,0.35)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {isSecretary ? "My Flat" : "Resident"}
                </p>

                <h2 className="mt-2 text-lg font-bold text-slate-950">My Maintenance</h2>
              </div>

              <span className="text-xl text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-900">
                →
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              View your maintenance bill, outstanding dues, payment history, and pay your bill
              online.
            </p>

            <div className="mt-auto pt-6 text-sm font-semibold text-slate-900">
              View My Bill
              <span className="ml-1">→</span>
            </div>
          </Link>

          {/* =================================================
              MEETINGS
          ================================================= */}

          <Link
            to={`/societies/${society.id}/meetings`}
            className="group flex h-full min-h-[230px] flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_50px_-25px_rgba(15,23,42,0.35)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Society
                </p>

                <h2 className="mt-2 text-lg font-bold text-slate-950">Meetings</h2>
              </div>

              <span className="text-xl text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-900">
                →
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              View upcoming and previous society meetings.
            </p>

            <div className="mt-auto pt-6 text-sm font-semibold text-slate-900">
              View meetings
              <span className="ml-1">→</span>
            </div>
          </Link>

          {/* =================================================
              ANNOUNCEMENTS
          ================================================= */}

          <Link
            to={`/societies/${society.id}/announcements`}
            className="group flex h-full min-h-[230px] flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_50px_-25px_rgba(15,23,42,0.35)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Society
                </p>

                <h2 className="mt-2 text-lg font-bold text-slate-950">Announcements</h2>
              </div>

              <span className="text-xl text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-900">
                →
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              View important announcements, updates, events, and notices from the society.
            </p>

            <div className="mt-auto pt-6 text-sm font-semibold text-slate-900">
              View announcements
              <span className="ml-1">→</span>
            </div>
          </Link>

          {/* =================================================
              SOCIETY MEMBERS
          ================================================= */}

          <Link
            to={`/societies/${society.id}/members`}
            className="group flex h-full min-h-[230px] flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_50px_-25px_rgba(15,23,42,0.35)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Community
                </p>

                <h2 className="mt-2 text-lg font-bold text-slate-950">Society Members</h2>
              </div>

              <span className="text-xl text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-900">
                →
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              View the secretary and active residents currently attached to this society.
            </p>

            <div className="mt-auto pt-6 text-sm font-semibold text-slate-900">
              View members
              <span className="ml-1">→</span>
            </div>
          </Link>

          {/* =================================================
              COMPLAINTS
          ================================================= */}

          <Link
            to={`/societies/${society.id}/complaints`}
            className="group flex h-full min-h-[230px] flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_50px_-25px_rgba(15,23,42,0.35)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Helpdesk
                </p>

                <h2 className="mt-2 text-lg font-bold text-slate-950">Complaints Helpdesk</h2>
              </div>

              <span className="text-xl text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-900">
                →
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Lodge, view, and manage complaints or maintenance issues in your society.
            </p>

            <div className="mt-auto pt-6 text-sm font-semibold text-slate-900">
              Go to complaints
              <span className="ml-1">→</span>
            </div>
          </Link>

          {/* =================================================
              CONTACTS
          ================================================= */}

          <Link
            to={`/societies/${society.id}/contacts`}
            className="group flex h-full min-h-[230px] flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_50px_-25px_rgba(15,23,42,0.35)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Directory
                </p>

                <h2 className="mt-2 text-lg font-bold text-slate-950">Society Contacts</h2>
              </div>

              <span className="text-xl text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-900">
                →
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Find contact numbers of emergency services, security, maintenance, and committee
              members.
            </p>

            <div className="mt-auto pt-6 text-sm font-semibold text-slate-900">
              View contacts
              <span className="ml-1">→</span>
            </div>
          </Link>
          {/* =================================================
    FINANCE
================================================= */}

          <Link
            to={`/societies/${society.id}/finance`}
            className="group flex h-full min-h-[230px] flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_50px_-25px_rgba(15,23,42,0.35)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Society
                </p>

                <h2 className="mt-2 text-lg font-bold text-slate-950">Finance</h2>
              </div>

              <span className="text-xl text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-900">
                →
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              View society income, expenses, transactions, and current financial balance.
            </p>

            <div className="mt-auto pt-6 text-sm font-semibold text-slate-900">
              View Finance
              <span className="ml-1">→</span>
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

export default SocietyDashboardPage;
