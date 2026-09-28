import { useState } from "react";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import Modal from "../../../components/common/Modal.jsx";
import Button from "../../../components/common/Button.jsx";

const CATEGORY_COLORS = {
  PLUMBING: "bg-cyan-50 text-cyan-700 border-cyan-200",
  ELECTRICAL: "bg-amber-50 text-amber-700 border-amber-200",
  SECURITY: "bg-rose-50 text-rose-700 border-rose-200",
  CLEANLINESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SECRETARY: "bg-purple-50 text-purple-700 border-purple-200",
  OTHER: "bg-slate-50 text-slate-700 border-slate-200"
};

function ComplaintCard({ complaint, currentUser, userRole, onStatusUpdate, onDelete }) {
  const isOwner =
    currentUser &&
    (currentUser.id === complaint.userId?._id ||
      currentUser._id === complaint.userId?._id ||
      currentUser.id === complaint.userId ||
      currentUser._id === complaint.userId);
  const isSecretary = userRole === "SECRETARY";
  const isSecretaryComplaint = complaint.category === "SECRETARY";

  const [actionModal, setActionModal] = useState({
    isOpen: false,
    status: null // "resolved" | "rejected"
  });
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const formattedDate = new Date(complaint.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const formattedResolvedDate = complaint.resolvedAt
    ? new Date(complaint.resolvedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : null;

  const openStatusDialog = (targetStatus) => {
    setActionModal({
      isOpen: true,
      status: targetStatus
    });
    setNote("");
    setNoteError("");
  };

  const closeStatusDialog = () => {
    setActionModal({
      isOpen: false,
      status: null
    });
    setNote("");
    setNoteError("");
  };

  const handleSubmitStatus = async (e) => {
    e.preventDefault();
    if (!note.trim()) {
      setNoteError(
        actionModal.status === "resolved"
          ? "Please provide details on how this issue was resolved."
          : "Please provide a reason for rejecting this complaint."
      );
      return;
    }

    try {
      setSubmitting(true);
      setNoteError("");
      await onStatusUpdate(complaint._id, actionModal.status, note.trim());
      closeStatusDialog();
    } catch (err) {
      setNoteError(err?.message || "Failed to update complaint status.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider border ${CATEGORY_COLORS[complaint.category] || CATEGORY_COLORS.OTHER}`}
            >
              {complaint.category === "SECRETARY" ? "Secretary / Management" : complaint.category}
            </span>
            <h3 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {complaint.title}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge type="complaint" status={complaint.status} />
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
          {complaint.description}
        </p>

        {/* Resolution note display for resolved complaints */}
        {complaint.status === "resolved" && complaint.resolutionNote && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-200 text-emerald-800 text-xs">
                ✓
              </span>
              Resolution Details
            </div>
            <p className="mt-2 text-sm text-emerald-950 whitespace-pre-line font-normal">
              {complaint.resolutionNote}
            </p>
            {(formattedResolvedDate || complaint.resolvedBy?.name) && (
              <p className="mt-2 text-xs text-emerald-700">
                Resolved {complaint.resolvedBy?.name ? `by ${complaint.resolvedBy.name}` : ""}{" "}
                {formattedResolvedDate ? `on ${formattedResolvedDate}` : ""}
              </p>
            )}
          </div>
        )}

        {/* Rejection reason display for rejected complaints */}
        {complaint.status === "rejected" && complaint.resolutionNote && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-800">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-200 text-rose-800 text-xs">
                ✕
              </span>
              Reason for Rejection
            </div>
            <p className="mt-2 text-sm text-rose-950 whitespace-pre-line font-normal">
              {complaint.resolutionNote}
            </p>
            {(formattedResolvedDate || complaint.resolvedBy?.name) && (
              <p className="mt-2 text-xs text-rose-700">
                Reviewed {complaint.resolvedBy?.name ? `by ${complaint.resolvedBy.name}` : ""}{" "}
                {formattedResolvedDate ? `on ${formattedResolvedDate}` : ""}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-50 pt-4 text-xs">
          <div className="flex items-center gap-2">
            <img
              src={
                complaint.userId?.avatarUrl ||
                "https://static.vecteezy.com/system/resources/thumbnails/020/937/370/small/user-icon-for-your-website-design-logo-app-ui-free-vector.jpg"
              }
              alt={complaint.userId?.name || "Member"}
              className="h-8 w-8 rounded-full border border-slate-200 bg-slate-100 object-cover"
            />

            <div>
              <p className="font-semibold text-slate-800">
                {complaint.userId?.name || "Deleted User"}
              </p>
              <p className="text-slate-400">
                Flat {complaint.flatId?.wing ?? ""}-{complaint.flatId?.flatNumber ?? "N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">{formattedDate}</span>

            <div className="flex items-center gap-2">
              {/* If Secretary Complaint: only creator can resolve */}
              {isSecretaryComplaint && complaint.status === "pending" && (
                <>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => openStatusDialog("resolved")}
                      className="rounded-lg bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>✓</span>
                      <span>Resolve My Complaint</span>
                    </button>
                  )}

                  {!isOwner && isSecretary && (
                    <span className="rounded-lg bg-purple-50 border border-purple-200 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
                      Resolvable by complainant only
                    </span>
                  )}
                </>
              )}

              {/* Standard complaints: Secretary can resolve or reject */}
              {!isSecretaryComplaint && isSecretary && complaint.status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => openStatusDialog("resolved")}
                    className="rounded-lg bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>✓</span>
                    <span>Resolve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openStatusDialog("rejected")}
                    className="rounded-lg bg-rose-50 px-3 py-1.5 font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>✕</span>
                    <span>Reject</span>
                  </button>
                </>
              )}

              {/* Delete button:
                  - For Secretary complaints: ONLY the resident creator (isOwner) can delete. Secretary CANNOT delete.
                  - For standard complaints: Owner or Secretary can delete.
              */}
              {isSecretaryComplaint && isOwner && (
                <button
                  type="button"
                  onClick={() => onDelete(complaint._id)}
                  className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-650 transition cursor-pointer"
                  title="Delete Complaint"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}

              {!isSecretaryComplaint && (isOwner || isSecretary) && (
                <button
                  type="button"
                  onClick={() => onDelete(complaint._id)}
                  className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-650 transition cursor-pointer"
                  title="Delete Complaint"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Dialog for Resolution or Rejection */}
      <Modal
        isOpen={actionModal.isOpen}
        title={actionModal.status === "resolved" ? "Resolve Complaint" : "Reject Complaint"}
        onClose={closeStatusDialog}
      >
        <form onSubmit={handleSubmitStatus} className="space-y-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-600">
            <p className="font-semibold text-slate-900">{complaint.title}</p>
            <p className="mt-1 line-clamp-2 text-slate-500">{complaint.description}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">
              {actionModal.status === "resolved" ? (
                <span>
                  How was this resolved? <span className="text-red-500">*</span>
                </span>
              ) : (
                <span>
                  Reason for rejection <span className="text-red-500">*</span>
                </span>
              )}
            </label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (noteError) {
                  setNoteError("");
                }
              }}
              placeholder={
                actionModal.status === "resolved"
                  ? "Describe what actions were taken (e.g., Plumber visited and replaced pipe connector in flat 302)..."
                  : "Explain why this complaint cannot be processed or is declined..."
              }
              className={`w-full rounded-xl border p-3 text-sm outline-none transition focus:ring-2 ${
                noteError
                  ? "border-red-400 focus:ring-red-100"
                  : actionModal.status === "resolved"
                    ? "border-slate-300 focus:border-emerald-500 focus:ring-emerald-100"
                    : "border-slate-300 focus:border-rose-500 focus:ring-rose-100"
              }`}
            />
            <div className="mt-1 flex justify-between text-xs">
              {noteError ? (
                <p className="text-red-600 font-medium">{noteError}</p>
              ) : (
                <p className="text-slate-400">
                  {actionModal.status === "resolved"
                    ? "This resolution explanation will be visible to the resident."
                    : "The resident will be notified with this rejection reason."}
                </p>
              )}
              <span className="text-slate-400">{note.length} chars</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={closeStatusDialog}
              disabled={submitting}
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={submitting}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 cursor-pointer ${
                actionModal.status === "resolved"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {submitting
                ? "Submitting..."
                : actionModal.status === "resolved"
                  ? "Confirm & Resolve"
                  : "Confirm & Reject"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default ComplaintCard;
