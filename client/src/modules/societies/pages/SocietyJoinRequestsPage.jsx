import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import {
  approveSocietyJoinRequest,
  getSocietyJoinRequests,
  rejectSocietyJoinRequest
} from "../api/society.api.js";

function SocietyJoinRequestsPage() {
  const { societyId } = useParams();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionRequestId, setActionRequestId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadRequests = async () => {
    try {
      setErrorMessage("");
      const requestList = await getSocietyJoinRequests(societyId);
      setRequests(requestList);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load joining requests."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadPage = async () => {
      try {
        const requestList = await getSocietyJoinRequests(societyId);

        if (!cancelled) {
          setRequests(requestList);
          setErrorMessage("");
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getApiErrorMessage(error, "Unable to load joining requests."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [societyId]);

  const handleAction = async (requestId, action) => {
    setActionRequestId(requestId);
    setErrorMessage("");

    try {
      if (action === "approve") {
        await approveSocietyJoinRequest(societyId, requestId);
      } else {
        await rejectSocietyJoinRequest(societyId, requestId);
      }

      await loadRequests();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, `Unable to ${action} the joining request.`));
    } finally {
      setActionRequestId(null);
    }
  };

  return (
    <AppShell
      title="Joining requests"
      description="Review residents who entered your society joining code and approve or reject their access."
      backTo={`/societies/${societyId}/dashboard`}
    >
      <div className="mx-auto max-w-5xl">
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-5 text-red-700">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.25)]">
            <div className="animate-pulse space-y-5">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex flex-col gap-4 border-b border-slate-100 pb-5 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="h-4 w-40 rounded bg-slate-200" />
                    <div className="mt-3 h-3 w-56 rounded bg-slate-100" />
                  </div>
                  <div className="h-10 w-44 rounded-xl bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-500">
              JR
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">No pending requests</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              New requests will appear here after a user enters this society&apos;s joining code.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.3)]">
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Secretary review
                  </p>
                  <h2 className="mt-1.5 text-lg font-bold text-slate-950">Pending requests</h2>
                </div>

                <span className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">
                  {requests.length}
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {requests.map((request) => {
                const user = request.user;
                const isActing = actionRequestId === request.id;

                return (
                  <div
                    key={request.id}
                    className="flex flex-col gap-5 px-6 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-xs">
                          {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-950 text-base">
                              {user?.name ?? "Unknown user"}
                            </h3>
                            {request.memberType && (
                              <span className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] font-semibold text-purple-700 uppercase tracking-wide">
                                {request.memberType}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {user?.email ?? "No email available"}
                          </p>
                        </div>
                      </div>

                      {/* Proposed Flat Details */}
                      {request.flatNumber && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 pl-0 sm:pl-14">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-900">
                            🏢 Flat {request.wing ? `${request.wing}-` : ""}
                            {request.flatNumber}
                          </span>
                          {request.floor !== null && request.floor !== undefined && (
                            <span className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                              Floor {request.floor}
                            </span>
                          )}
                          {request.flatType && (
                            <span className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {request.flatType}
                            </span>
                          )}
                          {request.addressNote && (
                            <span className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs text-slate-600 italic">
                              &ldquo;{request.addressNote}&rdquo;
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 pl-0 text-xs text-slate-500 sm:pl-14">
                        {(request.mobileNumber || user?.mobileNumber) && (
                          <span>📞 {request.mobileNumber || user?.mobileNumber}</span>
                        )}
                        <span>🕒 Requested {new Date(request.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleAction(request.id, "reject")}
                        className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isActing ? "Updating..." : "Reject"}
                      </button>

                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleAction(request.id, "approve")}
                        className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isActing ? "Updating..." : "Approve"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate(`/societies/${societyId}/dashboard`)}
          className="mt-6 text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-950 hover:decoration-slate-950"
        >
          Back to society dashboard
        </button>
      </div>
    </AppShell>
  );
}

export default SocietyJoinRequestsPage;
