import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { createAnnouncement } from "../api/announcement.api.js";

const announcementTypes = [
  {
    value: "GENERAL",
    label: "General"
  },
  {
    value: "EMERGENCY",
    label: "Emergency"
  },
  {
    value: "EVENT",
    label: "Event"
  },
  {
    value: "REMINDER",
    label: "Reminder"
  },
  {
    value: "UPDATE",
    label: "Update"
  }
];

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function CreateAnnouncementPage() {
  const { societyId } = useParams();
  const navigate = useNavigate();

  const today = getTodayDate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "GENERAL",
    date: today
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");

    if (!form.title.trim()) {
      setErrorMessage("Announcement title is required.");
      return;
    }

    if (!form.description.trim()) {
      setErrorMessage("Announcement description is required.");
      return;
    }

    if (!form.date) {
      setErrorMessage("Announcement date is required.");
      return;
    }

    if (form.date < today) {
      setErrorMessage("Announcement date cannot be in the past.");
      return;
    }

    try {
      setLoading(true);

      await createAnnouncement(societyId, {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        date: form.date
      });

      navigate(`/societies/${societyId}/announcements`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to create the announcement."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Create announcement"
      description="Post an important update for your society."
      backTo={`/societies/${societyId}/announcements`}
    >
      <div className="mx-auto max-w-3xl">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-32px_rgba(15,23,42,0.35)]">
          {/* Header */}
          <div className="border-b border-slate-100 px-7 py-6 sm:px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Society announcements
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              Create announcement
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Share important information, updates, events, or notices with society residents.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 px-7 py-7 sm:px-8">
              {/* Error */}
              {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
                      !
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-red-900">
                        Unable to create announcement
                      </p>

                      <p className="mt-1 text-sm leading-6 text-red-700">{errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-slate-900">
                  Title
                </label>

                <p className="mt-1 text-xs text-slate-500">
                  Enter a short and clear title for the announcement.
                </p>

                <input
                  id="title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleChange}
                  maxLength={150}
                  placeholder="e.g. Water supply maintenance"
                  disabled={loading}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                />

                <p className="mt-1.5 text-right text-xs text-slate-400">{form.title.length}/150</p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-slate-900">
                  Description
                </label>

                <p className="mt-1 text-xs text-slate-500">
                  Provide the complete information residents need to know.
                </p>

                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  maxLength={2000}
                  rows={7}
                  placeholder="Write the announcement details here..."
                  disabled={loading}
                  className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                />

                <p className="mt-1.5 text-right text-xs text-slate-400">
                  {form.description.length}/2000
                </p>
              </div>

              {/* Type and Date */}
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Type */}
                <div>
                  <label htmlFor="type" className="block text-sm font-semibold text-slate-900">
                    Announcement type
                  </label>

                  <p className="mt-1 text-xs text-slate-500">
                    Select the category of this announcement.
                  </p>

                  <select
                    id="type"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    disabled={loading}
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    {announcementTypes.map((announcementType) => (
                      <option key={announcementType.value} value={announcementType.value}>
                        {announcementType.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label htmlFor="date" className="block text-sm font-semibold text-slate-900">
                    Announcement date
                  </label>

                  <p className="mt-1 text-xs text-slate-500">Select today or a future date.</p>

                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={form.date}
                    min={today}
                    onChange={handleChange}
                    disabled={loading}
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-600 shadow-sm">
                    i
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">Announcement visibility</p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      This announcement will be visible to active members of this society. Only the
                      secretary can create, edit, or delete announcements.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-7 py-5 sm:flex-row sm:justify-end sm:px-8">
              <button
                type="button"
                onClick={() => navigate(`/societies/${societyId}/announcements`)}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create announcement"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  );
}

export default CreateAnnouncementPage;
