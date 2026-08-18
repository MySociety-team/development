import { useEffect, useState } from "react";
import { Link } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { getMySubscription } from "../../subscriptions/api/subscription.api.js";
import { getMySocieties } from "../api/society.api.js";

function SocietiesPage() {
  const [societies, setSocieties] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadPage = async () => {
      try {
        const [mySocieties, subscriptionStatus] = await Promise.all([
          getMySocieties(),
          getMySubscription()
        ]);

        if (!cancelled) {
          setSocieties(mySocieties);
          setSubscription(subscriptionStatus);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getApiErrorMessage(error, "Unable to load your societies."));
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
  }, []);

  return (
    <AppShell
      title="Your societies"
      description="Open a society you already belong to, join another society with its code, or create a new society."
    >
      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          to="/societies/join"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-400 hover:shadow"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Existing society
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Join with a code</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Verify the society joining code, enter your flat details, and become a resident.
          </p>
        </Link>

        <Link
          to={subscription?.canCreateSociety ? "/societies/create" : "/subscription"}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-400 hover:shadow"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            New society
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Create a society</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {subscription?.canCreateSociety
              ? "Your creator subscription is ready. Continue to society setup."
              : "Purchase the simple 30-day creator access, then create your society."}
          </p>
        </Link>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Memberships</h2>
            <p className="mt-1 text-sm text-slate-500">
              One account can belong to multiple societies.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Loading societies...
          </div>
        ) : societies.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h3 className="text-lg font-semibold text-slate-900">No society memberships yet</h3>
            <p className="mt-2 text-sm text-slate-600">
              Join an existing society or create your first one.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {societies.map((society) => (
              <Link
                key={society.membershipId}
                to={`/societies/${society.id}/dashboard`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-bold text-slate-900">{society.name}</h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {society.role}
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{society.address}</p>

                <div className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  <p>
                    Flat:{" "}
                    <span className="font-semibold text-slate-900">
                      {society.flat?.wing} {society.flat?.flatNumber}
                    </span>
                  </p>
                  <p className="mt-1">
                    Member type:{" "}
                    <span className="font-semibold text-slate-900">{society.memberType}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

export default SocietiesPage;
