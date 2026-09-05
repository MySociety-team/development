import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import { getSociety } from "../../societies/api/society.api.js";

import { deleteAnnouncement, getAnnouncements } from "../api/announcement.api.js";

import ConfirmAnnouncementDialog from "./ConfirmAnnouncementDialog.jsx";

function formatAnnouncementDate(date) {
  if (!date) {
    return "No date";
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function getTypeLabel(type) {
  switch (type) {
    case "EMERGENCY":
      return "Emergency";

    case "EVENT":
      return "Event";

    case "REMINDER":
      return "Reminder";

    case "UPDATE":
      return "Update";

    case "GENERAL":
    default:
      return "General";
  }
}

function AnnouncementsPage() {
  const { societyId } = useParams();

  const [announcements, setAnnouncements] = useState([]);
  const [membership, setMembership] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadAnnouncements = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [announcementData, societyData] = await Promise.all([
          getAnnouncements(societyId),
          getSociety(societyId)
        ]);

        if (!cancelled) {
          setAnnouncements(announcementData?.announcements || []);

          setMembership(societyData?.membership || null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getApiErrorMessage(error, "Unable to load announcements."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAnnouncements();

    return () => {
      cancelled = true;
    };
  }, [societyId]);

  const isSecretary = membership?.role === "SECRETARY";

  const handleDelete = async () => {
    if (!announcementToDelete) {
      return;
    }

    try {
      setDeleting(true);
      setErrorMessage("");

      await deleteAnnouncement(societyId, announcementToDelete._id);

      setAnnouncements((currentAnnouncements) =>
        currentAnnouncements.filter((announcement) => announcement._id !== announcementToDelete._id)
      );

      setAnnouncementToDelete(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to delete the announcement."));
    } finally {
      setDeleting(false);
    }
  };

  /* Loading */
  if (loading) {
    return (
      <AppShell
        title="Announcements"
        description="Important updates and information from your society."
        backTo={`/societies/${societyId}/dashboard`}
      >
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse space-y-5">
            <div className="h-32 rounded-3xl bg-slate-200" />
            <div className="h-40 rounded-3xl bg-slate-200" />
            <div className="h-40 rounded-3xl bg-slate-200" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Announcements"
      description="Important updates and information from your society."
      backTo={`/societies/${societyId}/dashboard`}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Society communication
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Announcements</h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Important updates and information from your society.
            </p>
          </div>

          {/* Secretary only */}
          {isSecretary && (
            <Link
              to={`/societies/${societyId}/announcements/create`}
              className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + Create Announcement
            </Link>
          )}
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
                !
              </div>

              <div>
                <p className="text-sm font-semibold text-red-900">Something went wrong</p>

                <p className="mt-1 text-sm leading-6 text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!errorMessage && announcements.length === 0 && (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              !
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-950">No announcements yet</h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              There are currently no announcements for this society.
            </p>

            {isSecretary && (
              <Link
                to={`/societies/${societyId}/announcements/create`}
                className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Create first announcement
              </Link>
            )}
          </section>
        )}

        {/* Announcements List */}
        <div className="space-y-5">
          {announcements.map((announcement) => (
            <article
              key={announcement._id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)]"
            >
              <div className="p-5 sm:p-6">
                {/* Top Section */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Type */}
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                        {getTypeLabel(announcement.type)}
                      </span>

                      {/* Date */}
                      <span className="text-xs text-slate-400">
                        {formatAnnouncementDate(announcement.date)}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-950">
                      {announcement.title}
                    </h2>
                  </div>

                  {/* View Details */}
                  <Link
                    to={`/societies/${societyId}/announcements/${announcement._id}`}
                    className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View details
                  </Link>
                </div>

                {/* Description */}
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                  {announcement.description}
                </p>

                {/* Secretary Actions */}
                {isSecretary && (
                  <div className="mt-5 flex gap-3 border-t border-slate-100 pt-4">
                    {/* Edit */}
                    <Link
                      to={`/societies/${societyId}/announcements/${announcement._id}/edit`}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit
                    </Link>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setAnnouncementToDelete(announcement)}
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Custom Delete Confirmation Dialog */}
      <ConfirmAnnouncementDialog
        open={Boolean(announcementToDelete)}
        onCancel={() => {
          if (!deleting) {
            setAnnouncementToDelete(null);
          }
        }}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </AppShell>
  );
}

export default AnnouncementsPage;
