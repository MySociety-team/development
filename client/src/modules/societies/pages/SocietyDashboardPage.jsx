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

  if (loading) {
    return (
      <AppShell title="Society dashboard" backTo="/societies">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading society...
        </div>
      </AppShell>
    );
  }

  if (errorMessage || !data) {
    return (
      <AppShell title="Society dashboard" backTo="/societies">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage || "Society could not be loaded."}
        </div>
      </AppShell>
    );
  }

  const { society, membership } = data;

  return (
    <AppShell title={society.name} description={society.address} backTo="/societies">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Joining code
                </p>
                <p className="mt-2 font-mono text-3xl font-bold tracking-[0.2em] text-slate-900">
                  {society.joiningCode}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Share this code with authenticated residents who should join this society.
                </p>
              </div>

              <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                {membership.role}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Society information</h2>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total flats
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">{society.numberOfFlats}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Your member type
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">{membership.memberType}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-900">Facilities</h3>
              {society.facilities.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No facilities have been added.</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {society.facilities.map((facility) => (
                    <span
                      key={facility}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      {facility.replaceAll("_", " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Your flat</h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Flat</dt>
                <dd className="font-semibold text-slate-900">
                  {membership.flat?.wing} {membership.flat?.flatNumber}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Floor</dt>
                <dd className="font-semibold text-slate-900">{membership.flat?.floor}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Type</dt>
                <dd className="font-semibold text-slate-900">{membership.flat?.flatType}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Mobile</dt>
                <dd className="font-semibold text-slate-900">{membership.mobileNumber}</dd>
              </div>
            </dl>
          </div>

          <Link
            to={`/societies/${society.id}/members`}
            className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-400"
          >
            <h2 className="font-bold text-slate-900">Society members</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              View the secretary and active residents currently attached to this society.
            </p>
          </Link>
        </aside>
      </div>
    </AppShell>
  );
}

export default SocietyDashboardPage;
