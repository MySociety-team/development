import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { getSociety } from "../../societies/api/society.api.js";
import { getContacts } from "../api/contact.api.js";

function ContactPage() {
  const { societyId } = useParams();

  const [contacts, setContacts] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [contactsData, societyData] = await Promise.all([
          getContacts(societyId, search),
          getSociety(societyId)
        ]);

        if (!cancelled) {
          setContacts(contactsData.contacts ?? []);
          setUserRole(societyData?.membership?.role || null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getApiErrorMessage(error, "Unable to load contacts."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [societyId, search]);

  const isSecretary = userRole === "SECRETARY";

  return (
    <AppShell
      title="Society Contacts"
      description="Find electricians, plumbers, cleaners and other service providers."
      backTo={`/societies/${societyId}/dashboard`}
      societyId={societyId}
    >
      <div className="space-y-6">
        {/* Top section */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-slate-500"
          />

          {isSecretary && (
            <Link
              to={`/societies/${societyId}/contacts/create`}
              className="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-700 transition"
            >
              + Add Contact
            </Link>
          )}
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Loading contacts...
          </div>
        )}

        {/* Empty */}
        {!loading && !errorMessage && contacts.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <h2 className="font-bold text-slate-900">No contacts found</h2>

            <p className="mt-2 text-sm text-slate-500">
              There are no contacts available in this society.
            </p>
          </div>
        )}

        {/* Contacts */}
        {!loading && contacts.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {contacts.map((contact) => (
              <div
                key={contact._id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{contact.name}</h2>

                    <p className="mt-1 text-sm font-medium text-slate-500">{contact.profession}</p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    Contact
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Mobile</span>
                    <span className="font-semibold text-slate-900">{contact.mobileNumber}</span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Address</span>
                    <span className="text-right font-semibold text-slate-900">
                      {contact.address}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Charges</span>
                    <span className="font-semibold text-slate-900">₹{contact.charges}</span>
                  </div>

                  {contact.email && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Email</span>
                      <span className="font-semibold text-slate-900">{contact.email}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default ContactPage;
