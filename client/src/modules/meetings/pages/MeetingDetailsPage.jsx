import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAuth } from "../../auth/hooks/useAuth.js";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { deleteMeeting, getMeeting, updateMeeting } from "../api/meeting.api.js";

function MeetingDetailsPage() {
  const { societyId, meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isSecretary = user?.role === "SECRETARY" || user?.societyRole === "SECRETARY";

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadMeeting = async () => {
      try {
        const data = await getMeeting(societyId, meetingId);

        if (!cancelled) {
          setMeeting(data);
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

  const handleComplete = async () => {
    try {
      setErrorMessage("");

      const updatedMeeting = await updateMeeting(societyId, meetingId, {
        status: "COMPLETED"
      });

      setMeeting(updatedMeeting);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to update meeting."));
    }
  };

  const handleCancel = async () => {
    try {
      setErrorMessage("");

      const updatedMeeting = await updateMeeting(societyId, meetingId, {
        status: "CANCELLED"
      });

      setMeeting(updatedMeeting);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to cancel meeting."));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this meeting?")) {
      return;
    }

    try {
      setDeleting(true);
      setErrorMessage("");

      await deleteMeeting(societyId, meetingId);

      navigate(`/societies/${societyId}/meetings`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to delete meeting."));
    } finally {
      setDeleting(false);
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

  if (loading) {
    return (
      <AppShell title="Meeting" backTo={`/societies/${societyId}/meetings`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading meeting...
        </div>
      </AppShell>
    );
  }

  if (errorMessage || !meeting) {
    return (
      <AppShell title="Meeting" backTo={`/societies/${societyId}/meetings`}>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {errorMessage || "Meeting could not be loaded."}
        </div>
      </AppShell>
    );
  }

  return (
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
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Venue</p>
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

          {meeting.topics?.length ? (
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

        {meeting.status === "COMPLETED" && (
          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Attendance</h2>

                <p className="mt-1 text-sm text-slate-500">Attendance recorded for this meeting.</p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {meeting.attendance?.length || 0} records
              </span>
            </div>

            {meeting.attendance?.length > 0 ? (
              <div className="mt-5 space-y-2">
                {meeting.attendance.map((record) => (
                  <div
                    key={record.societyMemberId}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <span className="text-sm text-slate-700">{record.societyMemberId}</span>

                    <span className="text-xs font-bold text-slate-600">{record.status}</span>
                  </div>
                ))}
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
              <Link
                to={`/societies/${societyId}/meetings/${meetingId}/edit`}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Edit meeting
              </Link>

              {meeting.status === "UPCOMING" && (
                <>
                  <button
                    type="button"
                    onClick={handleComplete}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
                  >
                    Mark completed
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
                  >
                    Cancel meeting
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete meeting"}
              </button>

              {meeting.status === "COMPLETED" && (
                <Link
                  to={`/societies/${societyId}/meetings/${meetingId}/attendance`}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Manage attendance
                </Link>
              )}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

export default MeetingDetailsPage;
