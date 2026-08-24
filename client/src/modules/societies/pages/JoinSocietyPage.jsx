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

  const isVerified = verifiedSociety && !verifiedSociety.alreadyMember;

  return (
    <AppShell
      title="Join a society"
      description="Verify your society first, then add your flat and resident details."
      backTo="/societies"
    >
      {errorMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 shadow-sm">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold">
            !
          </div>

          <p>{errorMessage}</p>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        {/* Progress */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
              1
            </div>

            <span className="hidden text-sm font-semibold text-slate-900 sm:block">
              Verify society
            </span>
          </div>

          <div className="h-px flex-1 bg-slate-200" />

          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                isVerified
                  ? "bg-slate-950 text-white"
                  : "border border-slate-300 bg-white text-slate-400"
              }`}
            >
              2
            </div>

            <span
              className={`hidden text-sm font-semibold sm:block ${
                isVerified ? "text-slate-900" : "text-slate-400"
              }`}
            >
              Your details
            </span>
          </div>
        </div>

        <div className="grid gap-7 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
          {/* STEP 1 */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.3)]">
            <div className="border-b border-slate-100 px-7 py-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Step 01
              </p>

              <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
                Find your society
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter the joining code shared by your society secretary.
              </p>
            </div>

            <div className="p-7">
              <form onSubmit={handleVerify} className="space-y-5">
                <div>
                  <label
                    htmlFor="joiningCode"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                  >
                    Society joining code
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
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-center font-mono text-lg font-bold tracking-[0.3em] text-slate-950 outline-none transition-all placeholder:tracking-[0.2em] placeholder:text-slate-300 hover:border-slate-400 focus:border-slate-950 focus:bg-white focus:ring-4 focus:ring-slate-950/5"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    The code is usually shared by your secretary or society administrator.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {verifying ? "Verifying society..." : "Verify society"}
                </button>
              </form>

              {verifiedSociety && (
                <div
                  className={`mt-7 overflow-hidden rounded-2xl border ${
                    verifiedSociety.alreadyMember ? "border-slate-200" : "border-emerald-200"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between px-5 py-3 ${
                      verifiedSociety.alreadyMember ? "bg-slate-50" : "bg-emerald-50"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
                        verifiedSociety.alreadyMember ? "text-slate-500" : "text-emerald-700"
                      }`}
                    >
                      {verifiedSociety.alreadyMember ? "Already joined" : "Society verified"}
                    </span>

                    {!verifiedSociety.alreadyMember && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-bold text-slate-950">{verifiedSociety.name}</h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {verifiedSociety.address}
                    </p>

                    <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Flats
                        </p>

                        <p className="mt-0.5 text-sm font-bold text-slate-900">
                          {verifiedSociety.numberOfFlats}
                        </p>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Status
                        </p>

                        <p className="mt-0.5 text-sm font-bold text-slate-900">Verified</p>
                      </div>
                    </div>

                    {verifiedSociety.alreadyMember && (
                      <Link
                        to={`/societies/${verifiedSociety.id}/dashboard`}
                        className="mt-5 inline-flex text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900"
                      >
                        Open society dashboard →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* STEP 2 */}
          <section
            className={`rounded-3xl border bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.3)] transition-all duration-300 ${
              isVerified ? "border-slate-200" : "border-slate-200 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-7 py-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Step 02
                </p>

                <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
                  Your flat details
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Tell us where you live and how you are connected to the flat.
                </p>
              </div>

              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                  isVerified
                    ? "border-slate-200 bg-slate-50 text-slate-900"
                    : "border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                {isVerified ? "✓" : "🔒"}
              </div>
            </div>

            {!verifiedSociety && (
              <div className="mx-7 mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Verify your society first to unlock this form.
              </div>
            )}

            <form onSubmit={handleJoin} className="p-7">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Flat information
                  </p>

                  <div className="h-px bg-slate-100" />
                </div>

                <div>
                  <label
                    htmlFor="flatNumber"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Flat number
                  </label>

                  <input
                    id="flatNumber"
                    name="flatNumber"
                    value={form.flatNumber}
                    onChange={handleChange}
                    disabled={!isVerified}
                    placeholder="B-204"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-950 focus:bg-white focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="floor"
                    className="mb-2 block text-sm font-semibold text-slate-700"
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
                    disabled={!isVerified}
                    placeholder="2"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-950 focus:bg-white focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label htmlFor="wing" className="mb-2 block text-sm font-semibold text-slate-700">
                    Wing
                  </label>

                  <input
                    id="wing"
                    name="wing"
                    value={form.wing}
                    onChange={handleChange}
                    disabled={!isVerified}
                    placeholder="B"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-950 focus:bg-white focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="flatType"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Flat type
                  </label>

                  <select
                    id="flatType"
                    name="flatType"
                    value={form.flatType}
                    onChange={handleChange}
                    disabled={!isVerified}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition-all hover:border-slate-300 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Flat location
                  </label>

                  <input
                    id="addressNote"
                    name="addressNote"
                    value={form.addressNote}
                    onChange={handleChange}
                    disabled={!isVerified}
                    placeholder="Wing B, Flat 204"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-950 focus:bg-white focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Resident information
                  </p>

                  <div className="h-px bg-slate-100" />
                </div>

                <div>
                  <label
                    htmlFor="memberType"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Member type
                  </label>

                  <select
                    id="memberType"
                    name="memberType"
                    value={form.memberType}
                    onChange={handleChange}
                    disabled={!isVerified}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition-all hover:border-slate-300 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Mobile number
                  </label>

                  <input
                    id="mobileNumber"
                    name="mobileNumber"
                    value={form.mobileNumber}
                    onChange={handleChange}
                    disabled={!isVerified}
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-950 focus:bg-white focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="invitedEmails"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Other flat member emails
                    <span className="ml-1 text-xs font-normal text-slate-400">Optional</span>
                  </label>

                  <textarea
                    id="invitedEmails"
                    name="invitedEmails"
                    value={form.invitedEmails}
                    onChange={handleChange}
                    disabled={!isVerified}
                    rows="3"
                    placeholder="owner@example.com, family@example.com"
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-950 focus:bg-white focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Separate email addresses with commas.
                  </p>
                </div>

                <div className="sm:col-span-2 mt-2 border-t border-slate-100 pt-6">
                  <button
                    type="submit"
                    disabled={!isVerified || joining}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-[0_12px_28px_-14px_rgba(15,23,42,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none disabled:hover:translate-y-0"
                  >
                    {joining ? "Joining society..." : "Join society"}

                    {!joining && <span className="text-base">→</span>}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

export default JoinSocietyPage;
