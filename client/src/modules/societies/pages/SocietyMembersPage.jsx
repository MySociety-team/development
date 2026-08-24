import { useEffect, useState } from "react";
import { useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { getSocietyMembers } from "../api/society.api.js";

function SocietyMembersPage() {
  const { societyId } = useParams();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadMembers = async () => {
      try {
        const memberList = await getSocietyMembers(societyId);

        if (!cancelled) {
          setMembers(memberList);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getApiErrorMessage(error, "Unable to load society members."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMembers();

    return () => {
      cancelled = true;
    };
  }, [societyId]);

  return (
    <AppShell
      title="Society members"
      description="Active memberships in this society."
      backTo={`/societies/${societyId}/dashboard`}
    >
      <div className="mx-auto max-w-5xl">
        {/* Error */}
        {errorMessage && (
          <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
                !
              </div>

              <div>
                <p className="font-semibold text-red-900">Unable to load members</p>

                <p className="mt-1 text-sm leading-6 text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.25)]">
            <div className="animate-pulse space-y-5">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between gap-5 border-b border-slate-100 pb-5 last:border-0 last:pb-0"
                >
                  <div className="flex-1">
                    <div className="h-4 w-40 rounded bg-slate-200" />
                    <div className="mt-3 h-3 w-56 rounded bg-slate-100" />
                    <div className="mt-2 h-3 w-32 rounded bg-slate-100" />
                  </div>

                  <div className="hidden h-10 w-32 rounded-xl bg-slate-100 sm:block" />
                </div>
              ))}
            </div>
          </div>
        ) : members.length === 0 ? (
          /* Empty state */
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg text-slate-500">
              👥
            </div>

            <h2 className="mt-4 font-semibold text-slate-900">No active members</h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              No active members were found in this society.
            </p>
          </div>
        ) : (
          /* Members */
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.3)]">
            {/* List header */}
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Community
                  </p>

                  <h2 className="mt-1.5 text-lg font-bold text-slate-950">Active members</h2>
                </div>

                <span className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">
                  {members.length}
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {members.map((member) => {
                const email = member.user?.email;
                const phone = member.mobileNumber;

                return (
                  <div
                    key={member.id}
                    className="group flex flex-col justify-between gap-5 px-6 py-6 transition-colors duration-200 hover:bg-slate-50/70 sm:flex-row sm:items-center sm:px-7"
                  >
                    {/* Member information */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
                          {member.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>

                        <h2 className="font-bold text-slate-950">
                          {member.user?.name ?? "Unknown user"}
                        </h2>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                          {member.role}
                        </span>
                      </div>

                      {/* Email */}
                      {email && (
                        <div className="mt-2 flex items-center gap-2 pl-11">
                          <p className="min-w-0 truncate text-sm text-slate-500">{email}</p>

                          <a
                            href={`mailto:${email}`}
                            title="Send email"
                            aria-label={`Send email to ${member.user?.name ?? "resident"}`}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-900"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-4 w-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9Z"
                              />
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
                            </svg>
                          </a>
                        </div>
                      )}

                      {/* Phone */}
                      {phone && (
                        <div className="mt-1 flex items-center gap-2 pl-11">
                          <p className="text-sm font-medium text-slate-700">{phone}</p>

                          <a
                            href={`tel:${phone}`}
                            title="Call resident"
                            aria-label={`Call ${member.user?.name ?? "resident"}`}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-900"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-4 w-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5.5 4.5 8 3l3 5-2 1.5a15.7 15.7 0 0 0 5.5 5.5L16 13l5 3-1.5 2.5c-.6 1-1.8 1.5-3 1.3C10.2 18.7 5.3 13.8 4.2 7.5c-.2-1.2.3-2.4 1.3-3Z"
                              />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Flat details */}
                    <div className="pl-11 text-sm sm:pl-0 sm:text-right">
                      <p className="font-semibold text-slate-900">
                        {member.flat?.wing} {member.flat?.flatNumber}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">{member.flat?.flatType}</p>

                      <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        {member.memberType}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default SocietyMembersPage;
