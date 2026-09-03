import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { getSociety } from "../../societies/api/society.api.js";
import { createContact } from "../api/contact.api.js";

function CreateContactPage() {
  const { societyId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    profession: "",
    address: "",
    mobileNumber: "",
    email: "",
    charges: ""
  });

  const [checkingRole, setCheckingRole] = useState(true);
  const [isSecretary, setIsSecretary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const checkRole = async () => {
      try {
        const data = await getSociety(societyId);
        if (!cancelled) {
          setIsSecretary(data?.membership?.role === "SECRETARY");
        }
      } catch {
        if (!cancelled) {
          setIsSecretary(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingRole(false);
        }
      }
    };

    checkRole();

    return () => {
      cancelled = true;
    };
  }, [societyId]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");

    try {
      await createContact(societyId, {
        name: form.name,
        profession: form.profession,
        address: form.address,
        mobileNumber: form.mobileNumber,
        email: form.email || null,
        charges: form.charges
      });

      navigate(`/societies/${societyId}/contacts`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to create contact."));
    } finally {
      setLoading(false);
    }
  };

  if (checkingRole) {
    return (
      <AppShell
        title="Add Contact"
        description="Add a service provider to your society."
        backTo={`/societies/${societyId}/contacts`}
        societyId={societyId}
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Checking permissions...
        </div>
      </AppShell>
    );
  }

  if (!isSecretary) {
    return (
      <AppShell
        title="Add Contact"
        description="Add a service provider to your society."
        backTo={`/societies/${societyId}/contacts`}
        societyId={societyId}
      >
        <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-xl text-amber-600">
            🔒
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Secretary Access Only</h2>
          <p className="mt-2 text-sm text-slate-500">
            Only the society Secretary has permission to add or update service contacts in the
            directory.
          </p>
          <div className="mt-6">
            <Link
              to={`/societies/${societyId}/contacts`}
              className="inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              Back to Contacts
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Add Contact"
      description="Add a service provider to your society."
      backTo={`/societies/${societyId}/contacts`}
      societyId={societyId}
    >
      <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {errorMessage && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-700">Name</label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ramesh Electrician"
              required
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Profession</label>

            <input
              name="profession"
              value={form.profession}
              onChange={handleChange}
              placeholder="Electrician"
              required
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Address</label>

            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Mumbai, Maharashtra"
              required
              rows="3"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Mobile Number</label>

            <input
              name="mobileNumber"
              value={form.mobileNumber}
              onChange={handleChange}
              placeholder="9876543210"
              required
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Email</label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ramesh@example.com"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Charges</label>

            <input
              name="charges"
              value={form.charges}
              onChange={handleChange}
              placeholder="500"
              required
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-slate-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Contact"}
            </button>

            <button
              type="button"
              onClick={() => navigate(`/societies/${societyId}/contacts`)}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default CreateContactPage;
