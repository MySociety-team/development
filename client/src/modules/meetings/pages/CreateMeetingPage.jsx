import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { createMeeting } from "../api/meeting.api.js";

function CreateMeetingPage() {
  const { societyId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    dateTime: "",
    venue: "",
    duration: 60,
    topics: ""
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
      setLoading(true);
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
          .filter(Boolean)
      };

      await createMeeting(societyId, payload);

      navigate(`/societies/${societyId}/meetings`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to create meeting."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Create meeting"
      description="Schedule a new society meeting."
      backTo={`/societies/${societyId}/meetings`}
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
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                placeholder="Monthly society meeting"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">Description</label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                placeholder="Describe the purpose of the meeting..."
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
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
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
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
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
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                placeholder="Community Hall"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">Topics</label>

              <input
                name="topics"
                value={form.topics}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                placeholder="Maintenance, Security, Events"
              />

              <p className="mt-1 text-xs text-slate-500">Separate topics with commas.</p>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/societies/${societyId}/meetings`)}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create meeting"}
          </button>
        </div>
      </form>
    </AppShell>
  );
}

export default CreateMeetingPage;
