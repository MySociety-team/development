import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { getMeeting, updateMeeting } from "../api/meeting.api.js";

function EditMeetingPage() {
  const { societyId, meetingId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    dateTime: "",
    venue: "",
    duration: 60,
    topics: "",
    status: "UPCOMING"
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadMeeting = async () => {
      try {
        const meeting = await getMeeting(societyId, meetingId);

        const localDateTime = new Date(meeting.dateTime);
        const offset = localDateTime.getTimezoneOffset() * 60000;
        const localValue = new Date(localDateTime.getTime() - offset).toISOString().slice(0, 16);

        if (!cancelled) {
          setForm({
            title: meeting.title || "",
            description: meeting.description || "",
            dateTime: localValue,
            venue: meeting.venue || "",
            duration: meeting.duration || 60,
            topics: meeting.topics?.join(", ") || "",
            status: meeting.status || "UPCOMING"
          });
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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage("");

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        dateTime: new Date(form.dateTime).toISOString(),
        venue: form.venue.trim(),
        duration: Number(form.duration),
        topics: form.topics
          .split(",")
          .map((topic) => topic.trim())
          .filter(Boolean),
        status: form.status
      };

      await updateMeeting(societyId, meetingId, payload);

      navigate(`/societies/${societyId}/meetings/${meetingId}`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to update meeting."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Edit meeting" backTo={`/societies/${societyId}/meetings/${meetingId}`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading meeting...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Edit meeting"
      description="Update meeting information."
      backTo={`/societies/${societyId}/meetings/${meetingId}`}
    >
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-slate-900">Meeting title</label>

              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">Description</label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-900">Date and time</label>

                <input
                  type="datetime-local"
                  name="dateTime"
                  value={form.dateTime}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-900">Duration (minutes)</label>

                <input
                  type="number"
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  min="1"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">Venue</label>

              <input
                name="venue"
                value={form.venue}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">Topics</label>

              <input
                name="topics"
                value={form.topics}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                placeholder="Maintenance, Security, Events"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">Status</label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="UPCOMING">Upcoming</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/societies/${societyId}/meetings/${meetingId}`)}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </AppShell>
  );
}

export default EditMeetingPage;
