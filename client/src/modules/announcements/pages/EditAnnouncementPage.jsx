import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { getAnnouncement, updateAnnouncement } from "../api/announcement.api.js";

const announcementTypes = ["GENERAL", "EMERGENCY", "EVENT", "REMINDER", "UPDATE"];

function EditAnnouncementPage() {
  const { societyId, announcementId } = useParams();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "GENERAL",
    date: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadAnnouncement = async () => {
      try {
        const data = await getAnnouncement(societyId, announcementId);

        if (!cancelled) {
          const announcement = data.announcement;

          setForm({
            title: announcement.title || "",
            description: announcement.description || "",
            type: announcement.type || "GENERAL",
            date: announcement.date ? new Date(announcement.date).toISOString().slice(0, 10) : ""
          });
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getApiErrorMessage(error, "Unable to load announcement."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAnnouncement();

    return () => {
      cancelled = true;
    };
  }, [societyId, announcementId]);

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

      await updateAnnouncement(societyId, announcementId, form);

      navigate(`/societies/${societyId}/announcements/${announcementId}`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to update announcement."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Edit Announcement" backTo={`/societies/${societyId}/announcements`}>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading announcement...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Edit Announcement"
      description="Update the announcement information."
      backTo={`/societies/${societyId}/announcements/${announcementId}`}
    >
      <div className="mx-auto max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-slate-700">Title</label>

            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={150}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Description / Content</label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={7}
              maxLength={2000}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Type</label>

              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
              >
                {announcementTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Date</label>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/societies/${societyId}/announcements/${announcementId}`)}
              className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default EditAnnouncementPage;
