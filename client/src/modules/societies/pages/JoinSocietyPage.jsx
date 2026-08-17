import { useState } from "react";
import { Link, useNavigate } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorCode, getApiErrorMessage } from "../../../lib/apiError.js";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { joinSociety, verifySocietyCode } from "../api/society.api.js";

const FLAT_TYPES = ["1RK", "1BHK", "2BHK", "3BHK", "4BHK", "5BHK"];
const MEMBER_TYPES = ["OWNER", "TENANT", "FAMILY_MEMBER"];

const INITIAL_FORM = {
  flatNumber: "",
  floor: "",
  wing: "",
  addressNote: "",
  flatType: "2BHK",
  memberType: "OWNER",
  mobileNumber: "",
  invitedEmails: ""
};

const parseEmails = (value) => {
  return [
    ...new Set(
      value
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    )
  ];
};

function JoinSocietyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [joiningCode, setJoiningCode] = useState("");
  const [verifiedSociety, setVerifiedSociety] = useState(null);
  const [form, setForm] = useState({
    ...INITIAL_FORM,
    mobileNumber: user?.mobileNumber ?? ""
  });
  const [verifying, setVerifying] = useState(false);
  const [joining, setJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleVerify = async (event) => {
    event.preventDefault();

    if (!joiningCode.trim()) {
      setErrorMessage("Enter the society joining code.");
      return;
    }

    setVerifying(true);
    setErrorMessage("");

    try {
      const society = await verifySocietyCode(joiningCode.trim().toUpperCase());

      setVerifiedSociety(society);

      if (society.alreadyMember) {
        setErrorMessage("You are already a member of this society.");
      }
    } catch (error) {
      setVerifiedSociety(null);
      setErrorMessage(getApiErrorMessage(error, "Unable to verify this joining code."));
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));

    setErrorMessage("");
  };

  const handleJoin = async (event) => {
    event.preventDefault();

    if (!verifiedSociety || verifiedSociety.alreadyMember) {
      return;
    }

    if (
      !form.flatNumber.trim() ||
      form.floor === "" ||
      !form.wing.trim() ||
      !form.addressNote.trim() ||
      !form.mobileNumber.trim()
    ) {
      setErrorMessage("Complete all required flat and resident fields.");
      return;
    }

    setJoining(true);
    setErrorMessage("");

    try {
      const society = await joinSociety(verifiedSociety.id, {
        flatNumber: form.flatNumber.trim(),
        floor: Number(form.floor),
        wing: form.wing.trim(),
        addressNote: form.addressNote.trim(),
        flatType: form.flatType,
        memberType: form.memberType,
        mobileNumber: form.mobileNumber.trim(),
        invitedEmails: parseEmails(form.invitedEmails)
      });

      navigate(`/societies/${society.id}/dashboard`, {
        replace: true
      });
    } catch (error) {
      const code = getApiErrorCode(error);

      if (code === "SOCIETY_MEMBERSHIP_ALREADY_EXISTS") {
        setErrorMessage("You are already a member of this society.");
      } else {
        setErrorMessage(getApiErrorMessage(error, "Unable to join the society."));
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <AppShell
      title="Join a society"
      description="First verify the society code. After verification, enter the flat and resident information that will be attached to your membership."
      backTo="/societies"
    >
      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">1. Verify joining code</h2>

          <form onSubmit={handleVerify} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="joiningCode"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Joining code
              </label>
              <input
                id="joiningCode"
                name="joiningCode"
                value={joiningCode}
                onChange={(event) => {
                  setJoiningCode(event.target.value.toUpperCase());
                  setVerifiedSociety(null);
                  setErrorMessage("");
                }}
                maxLength={12}
                placeholder="A7K9P2"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono uppercase tracking-widest outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {verifying ? "Verifying..." : "Verify society"}
            </button>
          </form>

          {verifiedSociety && (
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">{verifiedSociety.name}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{verifiedSociety.address}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {verifiedSociety.numberOfFlats} flats
              </p>

              {verifiedSociety.alreadyMember && (
                <Link
                  to={`/societies/${verifiedSociety.id}/dashboard`}
                  className="mt-4 inline-flex text-sm font-semibold text-slate-900 underline"
                >
                  Open society dashboard
                </Link>
              )}
            </div>
          )}
        </section>

        <section
          className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${
            !verifiedSociety || verifiedSociety.alreadyMember ? "opacity-60" : ""
          }`}
        >
          <h2 className="text-lg font-bold text-slate-900">2. Resident and flat details</h2>

          <form onSubmit={handleJoin} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="flatNumber"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Flat number
              </label>
              <input
                id="flatNumber"
                name="flatNumber"
                value={form.flatNumber}
                onChange={handleChange}
                disabled={!verifiedSociety || verifiedSociety.alreadyMember}
                placeholder="B-204"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label htmlFor="floor" className="mb-1.5 block text-sm font-medium text-slate-700">
                Floor
              </label>
              <input
                id="floor"
                name="floor"
                type="number"
                step="1"
                value={form.floor}
                onChange={handleChange}
                disabled={!verifiedSociety || verifiedSociety.alreadyMember}
                placeholder="2"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label htmlFor="wing" className="mb-1.5 block text-sm font-medium text-slate-700">
                Wing
              </label>
              <input
                id="wing"
                name="wing"
                value={form.wing}
                onChange={handleChange}
                disabled={!verifiedSociety || verifiedSociety.alreadyMember}
                placeholder="B"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label htmlFor="flatType" className="mb-1.5 block text-sm font-medium text-slate-700">
                Flat type
              </label>
              <select
                id="flatType"
                name="flatType"
                value={form.flatType}
                onChange={handleChange}
                disabled={!verifiedSociety || verifiedSociety.alreadyMember}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-slate-900"
              >
                {FLAT_TYPES.map((flatType) => (
                  <option key={flatType} value={flatType}>
                    {flatType}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="addressNote"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Flat address / location note
              </label>
              <input
                id="addressNote"
                name="addressNote"
                value={form.addressNote}
                onChange={handleChange}
                disabled={!verifiedSociety || verifiedSociety.alreadyMember}
                placeholder="Wing B, Flat 204"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="memberType"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Member type
              </label>
              <select
                id="memberType"
                name="memberType"
                value={form.memberType}
                onChange={handleChange}
                disabled={!verifiedSociety || verifiedSociety.alreadyMember}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-slate-900"
              >
                {MEMBER_TYPES.map((memberType) => (
                  <option key={memberType} value={memberType}>
                    {memberType.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="mobileNumber"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Mobile number
              </label>
              <input
                id="mobileNumber"
                name="mobileNumber"
                value={form.mobileNumber}
                onChange={handleChange}
                disabled={!verifiedSociety || verifiedSociety.alreadyMember}
                placeholder="9876543210"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="invitedEmails"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Other flat member emails
              </label>
              <textarea
                id="invitedEmails"
                name="invitedEmails"
                value={form.invitedEmails}
                onChange={handleChange}
                disabled={!verifiedSociety || verifiedSociety.alreadyMember}
                rows="3"
                placeholder="owner@example.com, family@example.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Separate addresses with commas. They are stored with the flat; no automatic email is
                sent.
              </p>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={!verifiedSociety || verifiedSociety.alreadyMember || joining}
                className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {joining ? "Joining society..." : "Join society"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  );
}

export default JoinSocietyPage;
