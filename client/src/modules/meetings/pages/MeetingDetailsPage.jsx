import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { deleteMeeting, getMeeting, updateMeeting } from "../api/meeting.api.js";
import { getSociety } from "../../societies/api/society.api.js";

function MeetingDetailsPage() {
  const { societyId, meetingId } = useParams();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState(null);
  const [membership, setMembership] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  const [summary, setSummary] = useState("");
  const [summaryProcessing, setSummaryProcessing] = useState(false);
  const [summaryMessage, setSummaryMessage] = useState("");

  const [modal, setModal] = useState({
    open: false,
    type: null
  });

  useEffect(() => {
    let cancelled = false;

    const loadMeeting = async () => {
      try {
        const [meetingData, societyData] = await Promise.all([
          getMeeting(societyId, meetingId),
          getSociety(societyId)
        ]);

        if (!cancelled) {
          setMeeting(meetingData);
          setMembership(societyData.membership);
          setSummary(meetingData.summary || "");
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getApiErrorMessage(error, "Unable to load meeting."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMeeting();

    return () => {
      cancelled = true;
    };
  }, [societyId, meetingId]);

  const isSecretary = membership?.role === "SECRETARY";

  const openModal = (type) => {
    setErrorMessage("");

    setModal({
      open: true,
      type
    });
  };

  const closeModal = () => {
    if (processing) {
      return;
    }

    setModal({
      open: false,
      type: null
    });
  };

  const handleConfirmAction = async () => {
    if (!modal.type) {
      return;
    }

    try {
      setProcessing(true);
      setErrorMessage("");

      if (modal.type === "complete") {
        const updatedMeeting = await updateMeeting(societyId, meetingId, {
          status: "COMPLETED"
        });

        setMeeting(updatedMeeting);
        setSummary(updatedMeeting.summary || "");
      }

      if (modal.type === "cancel") {
        const updatedMeeting = await updateMeeting(societyId, meetingId, {
          status: "CANCELLED"
        });

        setMeeting(updatedMeeting);
      }

      if (modal.type === "delete") {
        await deleteMeeting(societyId, meetingId);

        navigate(`/societies/${societyId}/meetings`);
        return;
      }

      setModal({
        open: false,
        type: null
      });
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          modal.type === "delete" ? "Unable to delete meeting." : "Unable to update meeting."
        )
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveSummary = async (event) => {
    event.preventDefault();

    try {
      setSummaryProcessing(true);
      setSummaryMessage("");
      setErrorMessage("");

      const updatedMeeting = await updateMeeting(societyId, meetingId, {
        summary: summary.trim()
      });

      setMeeting(updatedMeeting);
      setSummary(updatedMeeting.summary || "");
      setSummaryMessage("Meeting summary saved successfully.");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to save meeting summary."));
    } finally {
      setSummaryProcessing(false);
    }
  };

  const formatDate = (dateTime) =>
    new Date(dateTime).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

  const formatTime = (dateTime) =>
    new Date(dateTime).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit"
    });

  const getModalContent = () => {
    if (modal.type === "complete") {
      return {
        title: "Mark meeting as completed?",
        description: "Are you sure you want to mark this meeting as completed?",
        buttonText: "Mark completed",
        buttonClass: "bg-slate-950 text-white hover:bg-slate-800"
      };
    }

    if (modal.type === "cancel") {
      return {
        title: "Cancel this meeting?",
        description: "Are you sure you want to cancel this meeting?",
        buttonText: "Cancel meeting",
        buttonClass: "bg-slate-950 text-white hover:bg-slate-800"
      };
    }

    if (modal.type === "delete") {
      return {
        title: "Delete this meeting?",
        description: "This action cannot be undone. The meeting will be permanently deleted.",
        buttonText: "Delete meeting",
        buttonClass: "bg-red-600 text-white hover:bg-red-700"
      };
    }

    return null;
  };

  if (loading) {
    return (
      <AppShell title="Meeting" backTo={`/societies/${societyId}/meetings`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading meeting...
        </div>
      </AppShell>
    );
  }

  if (errorMessage && !meeting) {
    return (
      <AppShell title="Meeting" backTo={`/societies/${societyId}/meetings`}>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {errorMessage}
        </div>
      </AppShell>
    );
  }

  if (!meeting) {
    return (
      <AppShell title="Meeting" backTo={`/societies/${societyId}/meetings`}>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Meeting could not be loaded.
        </div>
      </AppShell>
    );
  }

  const modalContent = getModalContent();

  return (
    <>
      <AppShell
        title="Meeting details"
        description="View meeting information and status."
        backTo={`/societies/${societyId}/meetings`}
      >
        <div className="mx-auto max-w-4xl space-y-6">
          {errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Society meeting
                </p>

                <h1 className="mt-2 text-3xl font-bold text-slate-950">{meeting.title}</h1>

                {meeting.description && (
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    {meeting.description}
                  </p>
                )}
              </div>

              <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700">
                {meeting.status}
              </span>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Date</p>

                <p className="mt-2 font-semibold text-slate-950">{formatDate(meeting.dateTime)}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Time</p>

                <p className="mt-2 font-semibold text-slate-950">{formatTime(meeting.dateTime)}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Venue
                </p>

                <p className="mt-2 font-semibold text-slate-950">{meeting.venue}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Duration
                </p>

                <p className="mt-2 font-semibold text-slate-950">{meeting.duration} minutes</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Topics to be discussed</h2>

            {meeting.topics?.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {meeting.topics.map((topic, index) => (
                  <span
                    key={`${meeting._id}-detail-topic-${index}`}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No topics have been added.</p>
            )}
          </section>

          {/* MEETING SUMMARY */}
          {meeting.status === "COMPLETED" && (
            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Meeting Summary</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Summary of what was discussed and decided in this meeting.
                </p>
              </div>

              {isSecretary ? (
                <form onSubmit={handleSaveSummary} className="mt-5">
                  <textarea
                    value={summary}
                    onChange={(event) => {
                      setSummary(event.target.value);
                      setSummaryMessage("");
                    }}
                    rows={6}
                    placeholder="Enter the meeting summary..."
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={summaryProcessing}
                      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {summaryProcessing ? "Saving..." : "Save Summary"}
                    </button>

                    {summaryMessage && (
                      <p className="text-sm font-medium text-green-600">{summaryMessage}</p>
                    )}
                  </div>
                </form>
              ) : meeting.summary ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {meeting.summary}
                  </p>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  No summary has been added yet.
                </div>
              )}
            </section>
          )}

          {meeting.status === "COMPLETED" && (
            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Attendance</h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Attendance recorded for this meeting.
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {meeting.attendance?.length || 0} records
                </span>
              </div>

              {meeting.attendance?.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {meeting.attendance.map((record, index) => {
                    const member = record.societyMemberId;

                    const memberName = member?.userId?.name || member?.name || "Unknown member";

                    const memberEmail = member?.userId?.email || "";

                    const memberId = member?._id || `attendance-${index}`;

                    return (
                      <div
                        key={memberId}
                        className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{memberName}</p>

                          {memberEmail && (
                            <p className="mt-1 text-xs text-slate-400">{memberEmail}</p>
                          )}
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                            record.status === "PRESENT"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  No attendance has been recorded yet.
                </div>
              )}
            </section>
          )}

          {isSecretary && (
            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">Secretary controls</h2>

              <div className="mt-5 flex flex-wrap gap-3">
                {meeting.status === "UPCOMING" && (
                  <Link
                    to={`/societies/${societyId}/meetings/${meetingId}/edit`}
                    className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Edit meeting
                  </Link>
                )}

                {meeting.status === "UPCOMING" && (
                  <>
                    <button
                      type="button"
                      onClick={() => openModal("complete")}
                      disabled={processing}
                      className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Mark completed
                    </button>

                    <button
                      type="button"
                      onClick={() => openModal("cancel")}
                      disabled={processing}
                      className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel meeting
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => openModal("delete")}
                  disabled={processing}
                  className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete meeting
                </button>

                {meeting.status === "COMPLETED" && (
                  <Link
                    to={`/societies/${societyId}/meetings/${meetingId}/attendance`}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Manage attendance
                  </Link>
                )}
              </div>
            </section>
          )}
        </div>
      </AppShell>

      {modal.open && modalContent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${
                  modal.type === "delete"
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {modal.type === "delete" ? "!" : "?"}
              </div>

              <div className="min-w-0">
                <h2 id="confirmation-title" className="text-lg font-bold text-slate-950">
                  {modalContent.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">{modalContent.description}</p>
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={processing}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Go back
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={processing}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${modalContent.buttonClass}`}
              >
                {processing ? "Please wait..." : modalContent.buttonText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MeetingDetailsPage;
