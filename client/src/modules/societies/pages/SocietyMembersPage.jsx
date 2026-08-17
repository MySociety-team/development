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
      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading members...
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          No active members were found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">
                      {member.user?.name ?? "Unknown user"}
                    </h2>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {member.role}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{member.user?.email}</p>
                </div>

                <div className="text-sm text-slate-600 sm:text-right">
                  <p>
                    {member.flat?.wing} {member.flat?.flatNumber} · {member.flat?.flatType}
                  </p>
                  <p className="mt-1">{member.memberType}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default SocietyMembersPage;
