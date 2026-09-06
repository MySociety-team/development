import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { getSociety } from "../../societies/api/society.api.js";
import { deleteAnnouncement, getAnnouncement } from "../api/announcement.api.js";

function AnnouncementDetailsPage() {
  const { societyId, announcementId } = useParams();

  const navigate = useNavigate();

  const [announcement, setAnnouncement] = useState(null);
  const [membership, setMembership] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [announcementData, societyData] = await Promise.all([
          getAnnouncement(societyId, announcementId),
          getSociety(societyId)
        ]);

        if (!cancelled) {
          setAnnouncement(announcementData.announcement);
          setMembership(societyData.membership);
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

    loadData();

    return () => {
      cancelled = true;
    };
  }, [societyId, announcementId]);

  const isSecretary = membership?.role === "SECRETARY";

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this announcement?");

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setErrorMessage("");

      await deleteAnnouncement(societyId, announcementId);

      navigate(`/societies/${societyId}/announcements`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to delete announcement."));
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

  const formatType = (type) => (type ? type.charAt(0) + type.slice(1).toLowerCase() : "General");

  if (loading) {
    return (
      <AppShell title="Announcement" backTo={`/societies/${societyId}/announcements`}>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading announcement...
        </div>
      </AppShell>
    );
  }

  if (errorMessage && !announcement) {
    return (
      <AppShell title="Announcement" backTo={`/societies/${societyId}/announcements`}>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {errorMessage}
        </div>
      </AppShell>
    );
  }

  if (!announcement) {
    return null;
  }

  return (
    <AppShell
      title="Announcement details"
      description="View the complete announcement."
      backTo={`/societies/${societyId}/announcements`}
    >
      <div className="mx-auto max-w-3xl">
        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              {formatType(announcement.type)}
            </span>

            <span className="text-sm text-slate-400">{formatDate(announcement.date)}</span>
          </div>

          <h1 className="mt-5 text-3xl font-bold text-slate-950">{announcement.title}</h1>

          <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {announcement.description}
          </div>

          {announcement.createdBy && (
            <div className="mt-8 border-t border-slate-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Posted by
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-900">
                {announcement.createdBy.name}
              </p>
            </div>
          )}

          {isSecretary && (
            <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
              <Link
                to={`/societies/${societyId}/announcements/${announcementId}/edit`}
                className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Edit
              </Link>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </article>
      </div>
    </AppShell>
  );
}

export default AnnouncementDetailsPage;
