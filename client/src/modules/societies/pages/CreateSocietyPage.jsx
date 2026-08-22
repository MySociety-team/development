import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorCode, getApiErrorMessage } from "../../../lib/apiError.js";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { getMySubscription } from "../../subscriptions/api/subscription.api.js";
import { createSociety } from "../api/society.api.js";

const APPROVED_FACILITIES = [
  "GYM",
  "SWIMMING_POOL",
  "CLUBHOUSE",
  "PARKING",
  "SECURITY",
  "GARDEN",
  "CHILDREN_PLAY_AREA",
  "COMMUNITY_HALL",
  "LIFT",
  "POWER_BACKUP"
];

const FLAT_TYPES = ["1RK", "1BHK", "2BHK", "3BHK", "4BHK", "5BHK"];
const MEMBER_TYPES = ["OWNER", "TENANT", "FAMILY_MEMBER"];

const INITIAL_FORM = {
  name: "",
  address: "",
  numberOfFlats: "",
  mobileNumber: "",
  flatNumber: "",
  floor: "",
  wing: "",
  addressNote: "",
  flatType: "2BHK",
  memberType: "OWNER",
  invitedEmails: "",
  customFacilities: ""
};

const parseCommaSeparated = (value) => {
  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ];
};

function CreateSocietyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    ...INITIAL_FORM,
    mobileNumber: user?.mobileNumber ?? ""
  });
  const [facilities, setFacilities] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const checkSubscription = async () => {
      try {
        const status = await getMySubscription();

        if (!cancelled) {
          setSubscription(status);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getApiErrorMessage(error, "Unable to verify your subscription."));
        }
      } finally {
        if (!cancelled) {
          setCheckingSubscription(false);
        }
      }
    };

    checkSubscription();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));

    setErrorMessage("");
  };

  const toggleFacility = (facility) => {
    setFacilities((current) =>
      current.includes(facility)
        ? current.filter((item) => item !== facility)
        : [...current, facility]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!subscription?.canCreateSociety) {
      setErrorMessage("An active creator subscription is required.");
      return;
    }

    if (
      !form.name.trim() ||
      !form.address.trim() ||
      !form.numberOfFlats ||
      !form.mobileNumber.trim() ||
      !form.flatNumber.trim() ||
      form.floor === "" ||
      !form.wing.trim() ||
      !form.addressNote.trim()
    ) {
      setErrorMessage("Complete all required society and secretary flat fields.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const society = await createSociety({
        name: form.name.trim(),
        address: form.address.trim(),
        numberOfFlats: Number(form.numberOfFlats),
        mobileNumber: form.mobileNumber.trim(),
        facilities: [...facilities, ...parseCommaSeparated(form.customFacilities)],
        invitedEmails: parseCommaSeparated(form.invitedEmails).map((email) => email.toLowerCase()),
        secretaryFlat: {
          flatNumber: form.flatNumber.trim(),
          floor: Number(form.floor),
          wing: form.wing.trim(),
          addressNote: form.addressNote.trim(),
          flatType: form.flatType,
          memberType: form.memberType
        }
      });

      navigate(`/societies/${society.id}/dashboard`, {
        replace: true
      });
    } catch (error) {
      if (getApiErrorCode(error) === "SOCIETY_CREATION_SUBSCRIPTION_REQUIRED") {
        setErrorMessage("Your creator access is no longer available. Purchase a new subscription.");

        setSubscription((current) => ({
          ...current,
          canCreateSociety: false
        }));
      } else {
        setErrorMessage(getApiErrorMessage(error, "Unable to create the society."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingSubscription) {
    return (
      <AppShell title="Create a society" backTo="/societies">
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 text-sm text-slate-600 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.25)] backdrop-blur-sm">
          Checking creator subscription...
        </div>
      </AppShell>
    );
  }

  if (!subscription?.canCreateSociety) {
    return (
      <AppShell
        title="Create a society"
        description="Society creation is available after a verified creator payment."
        backTo="/societies"
      >
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200/80 bg-red-50/80 px-4 py-3.5 text-sm leading-5 text-red-700 shadow-sm">
            {errorMessage}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200/80 bg-white p-10 text-center shadow-[0_20px_60px_-30px_rgba(15,23,42,0.3)]">
          <h2 className="text-xl font-bold text-slate-900">Creator subscription required</h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
            Purchase the simple 30-day Razorpay test subscription first. After the backend verifies
            the payment, this page becomes available.
          </p>

          <Link
            to="/subscription"
            className="mt-7 inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Open subscription page
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Create a society"
      description="You will become the secretary. Your active 30-day creator subscription allows society creation while it remains valid."
      backTo="/societies"
    >
      {errorMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200/80 bg-red-50/80 px-4 py-3.5 text-sm leading-5 text-red-700 shadow-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Society Details */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.35)] transition-shadow duration-200 hover:shadow-[0_18px_55px_-28px_rgba(15,23,42,0.38)]">
          <div className="flex items-start gap-3">
            <div className="mt-1.5 h-6 w-1 shrink-0 rounded-full bg-slate-900" />

            <div>
              <h2 className="text-lg font-bold tracking-[-0.01em] text-slate-950">
                Society details
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Set up the basic identity and contact details for your community.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="name"
                className="mb-2 block text-[13px] font-semibold tracking-wide text-slate-700"
              >
                Society name
              </label>

              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Green Valley Society"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="address"
                className="mb-2 block text-[13px] font-semibold tracking-wide text-slate-700"
              >
                Society address
              </label>

              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                rows="3"
                placeholder="Baner Road, Pune"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              />
            </div>

            <div>
              <label
                htmlFor="numberOfFlats"
                className="mb-2 block text-[13px] font-semibold tracking-wide text-slate-700"
              >
                Number of flats
              </label>

              <input
                id="numberOfFlats"
                name="numberOfFlats"
                type="number"
                min="1"
                max="25"
                step="1"
                value={form.numberOfFlats}
                onChange={handleChange}
                placeholder="25"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                The base ₹599 flow includes up to 25 flats. Extra-flat billing is intentionally
                deferred until your team chooses the actual per-flat fee.
              </p>
            </div>

            <div>
              <label
                htmlFor="mobileNumber"
                className="mb-2 block text-[13px] font-semibold tracking-wide text-slate-700"
              >
                Secretary mobile number
              </label>

              <input
                id="mobileNumber"
                name="mobileNumber"
                value={form.mobileNumber}
                onChange={handleChange}
                placeholder="9876543210"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              />
            </div>
          </div>
        </section>

        {/* Facilities */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.35)] transition-shadow duration-200 hover:shadow-[0_18px_55px_-28px_rgba(15,23,42,0.38)]">
          <div className="flex items-start gap-3">
            <div className="mt-1.5 h-6 w-1 shrink-0 rounded-full bg-slate-900" />

            <div>
              <h2 className="text-lg font-bold tracking-[-0.01em] text-slate-950">Facilities</h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Choose what residents can access in the society.
              </p>
            </div>
          </div>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
            Select standard facilities and optionally enter custom values.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {APPROVED_FACILITIES.map((facility) => (
              <label
                key={facility}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-sm font-medium transition-all duration-200 ${
                  facilities.includes(facility)
                    ? "border-slate-900 bg-slate-50 text-slate-950 shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/70"
                }`}
              >
                <input
                  type="checkbox"
                  checked={facilities.includes(facility)}
                  onChange={() => toggleFacility(facility)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />

                {facility.replaceAll("_", " ")}
              </label>
            ))}
          </div>

          <div className="mt-4">
            <label
              htmlFor="customFacilities"
              className="mb-2 block text-[13px] font-semibold tracking-wide text-slate-700"
            >
              Custom facilities
            </label>

            <input
              id="customFacilities"
              name="customFacilities"
              value={form.customFacilities}
              onChange={handleChange}
              placeholder="Temple, Reading Room"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Separate custom facilities with commas.
            </p>
          </div>
        </section>

        {/* Secretary Flat */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.35)] transition-shadow duration-200 hover:shadow-[0_18px_55px_-28px_rgba(15,23,42,0.38)]">
          <div className="flex items-start gap-3">
            <div className="mt-1.5 h-6 w-1 shrink-0 rounded-full bg-slate-900" />

            <div>
              <h2 className="text-lg font-bold tracking-[-0.01em] text-slate-950">
                Secretary flat
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Add the flat details associated with your secretary account.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="flatNumber"
                className="mb-2 block text-[13px] font-semibold tracking-wide text-slate-700"
              >
                Flat number
              </label>

              <input
                id="flatNumber"
                name="flatNumber"
                value={form.flatNumber}
                onChange={handleChange}
                placeholder="A-101"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              />
            </div>

            <div>
              <label
                htmlFor="floor"
                className="mb-2 block text-[13px] font-semibold tracking-wide text-slate-700"
              >
                Floor
              </label>

              <input
                id="floor"
                name="floor"
                type="number"
                step="1"
                value={form.floor}
                onChange={handleChange}
                placeholder="1"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              />
            </div>

            <div>
              <label
                htmlFor="wing"
                className="mb-2 block text-[13px] font-semibold tracking-wide text-slate-700"
              >
                Wing
              </label>

              <input
                id="wing"
                name="wing"
                value={form.wing}
                onChange={handleChange}
                placeholder="A"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              />
            </div>

            <div>
              <label
                htmlFor="flatType"
                className="mb-2 block text-[13px] font-semibold tracking-wide text-slate-700"
              >
                Flat type
              </label>

              <select
                id="flatType"
                name="flatType"
                value={form.flatType}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
              >
                {FLAT_TYPES.map((flatType) => (
                  <option key={flatType} value={flatType}>
                    {flatType}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="memberType"
                className="mb-2 block text-[13px] font-semibold tracking-wide text-slate-700"
              >
                Member type
              </label>

              <select
                id="memberType"
                name="memberType"
                value={form.memberType}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
              >
                {MEMBER_TYPES.map((memberType) => (
                  <option key={memberType} value={memberType}>
                    {memberType.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="addressNote"
                className="mb-2 block text-[13px] font-semibold tracking-wide text-slate-700"
              >
                Flat address / location note
              </label>

              <input
                id="addressNote"
                name="addressNote"
                value={form.addressNote}
                onChange={handleChange}
                placeholder="Wing A, Flat 101"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="invitedEmails"
                className="mb-2 block text-[13px] font-semibold tracking-wide text-slate-700"
              >
                Other flat member emails
              </label>

              <textarea
                id="invitedEmails"
                name="invitedEmails"
                value={form.invitedEmails}
                onChange={handleChange}
                rows="3"
                placeholder="family@example.com, tenant@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                These addresses are stored only. The initial project does not send automatic
                invitations.
              </p>
            </div>
          </div>
        </section>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_25px_-12px_rgba(15,23,42,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_14px_30px_-12px_rgba(15,23,42,0.65)] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {submitting ? "Creating society..." : "Create society"}
        </button>
      </form>
    </AppShell>
  );
}

export default CreateSocietyPage;
