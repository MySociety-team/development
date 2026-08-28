import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { getMeetings } from "../api/meeting.api.js";
import { getSociety } from "../../societies/api/society.api.js";

function MeetingsPage() {
  const { societyId } = useParams();

  const [meetings, setMeetings] = useState([]);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadMeetings = async () => {
      try {
        const [meetingsData, societyData] = await Promise.all([
          getMeetings(societyId),
          getSociety(societyId)
        ]);

        if (!cancelled) {
          setMeetings(meetingsData || []);
          setMembership(societyData.membership);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getApiErrorMessage(error, "Unable to load meetings."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMeetings();

    return () => {
      cancelled = true;
    };
  }, [societyId]);

  const isSecretary = membership?.role === "SECRETARY";

  const now = new Date();

  const upcomingMeetings = meetings.filter(
    (meeting) => meeting.status === "UPCOMING" && new Date(meeting.dateTime) >= now
  );

  const previousMeetings = meetings.filter(
    (meeting) =>
      meeting.status === "COMPLETED" ||
      meeting.status === "CANCELLED" ||
      new Date(meeting.dateTime) < now
  );

  const formatDate = (dateTime) =>
    new Date(dateTime).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

  const formatTime = (dateTime) =>
    new Date(dateTime).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit"
    });

  const MeetingCard = ({ meeting }) => (
    <Link
      to={`/societies/${societyId}/meetings/${meeting._id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-950">{meeting.title}</h3>

          <p className="mt-1 text-sm text-slate-500">
            {formatDate(meeting.dateTime)} at {formatTime(meeting.dateTime)}
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {meeting.status}
        </span>
      </div>

      {meeting.description && (
        <p className="mt-4 text-sm leading-6 text-slate-600">{meeting.description}</p>
      )}

      <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <p>
          <span className="font-semibold text-slate-900">Venue:</span> {meeting.venue}
        </p>

        <p>
          <span className="font-semibold text-slate-900">Duration:</span> {meeting.duration} minutes
        </p>
      </div>

      {meeting.topics?.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Topics</p>

          <div className="mt-2 flex flex-wrap gap-2">
            {meeting.topics.map((topic, index) => (
              <span
                key={`${meeting._id}-topic-${index}`}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </Link>
  );

  return (
    <AppShell
      title="Meetings"
      description="View upcoming and previous society meetings."
      backTo={`/societies/${societyId}/dashboard`}
    >
      <div className="mx-auto max-w-6xl space-y-8">
        {isSecretary && (
          <div className="flex justify-end">
            <Link
              to={`/societies/${societyId}/meetings/create`}
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + Create Meeting
            </Link>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Loading meetings...
          </div>
        ) : (
          <>
            <section>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-950">Upcoming meetings</h2>

                <p className="mt-1 text-sm text-slate-500">Meetings scheduled for the society.</p>
              </div>

              {upcomingMeetings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <p className="text-sm text-slate-500">No upcoming meetings.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {upcomingMeetings.map((meeting) => (
                    <MeetingCard key={meeting._id} meeting={meeting} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-950">Previous meetings</h2>

                <p className="mt-1 text-sm text-slate-500">Completed or cancelled meetings.</p>
              </div>

              {previousMeetings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <p className="text-sm text-slate-500">No previous meetings.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {previousMeetings.map((meeting) => (
                    <MeetingCard key={meeting._id} meeting={meeting} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default MeetingsPage;
