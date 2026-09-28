import { useState, useRef } from "react";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import Modal from "../../../components/common/Modal.jsx";
import Button from "../../../components/common/Button.jsx";
import { compressImage, formatFileSize } from "../../../utils/imageCompressor.js";

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
  const [resolutionImg, setResolutionImg] = useState(null);
  const [compressingImg, setCompressingImg] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const resolutionFileInputRef = useRef(null);

  // Lightbox preview modal state
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    imageUrl: "",
    title: ""
  });

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
    setResolutionImg(null);
    setNoteError("");
  };

  const closeStatusDialog = () => {
    setActionModal({
      isOpen: false,
      status: null
    });
    setNote("");
    setResolutionImg(null);
    setNoteError("");
  };

  const handleResolutionFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setCompressingImg(true);
      setNoteError("");
      const compressed = await compressImage(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.75
      });
      setResolutionImg(compressed);
    } catch (err) {
      setNoteError(err?.message || "Failed to process photo.");
    } finally {
      setCompressingImg(false);
      if (resolutionFileInputRef.current) {
        resolutionFileInputRef.current.value = "";
      }
    }
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
      await onStatusUpdate(
        complaint._id,
        actionModal.status,
        note.trim(),
        resolutionImg?.dataUrl || ""
      );
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

        {/* Attached Photos by complainant */}
        {complaint.images && complaint.images.length > 0 && (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <span>📷</span>
              <span>Attached Photos ({complaint.images.length})</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {complaint.images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    setPreviewModal({
                      isOpen: true,
                      imageUrl: imgUrl,
                      title: `${complaint.title} - Photo #${idx + 1}`
                    })
                  }
                  className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs hover:border-blue-400 focus:outline-none transition cursor-pointer"
                >
                  <img
                    src={imgUrl}
                    alt={`Complaint image ${idx + 1}`}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-200"
                  />
                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="rounded-lg bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-800 shadow">
                      View
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resolution display for resolved complaints */}
        {complaint.status === "resolved" &&
          (complaint.resolutionNote || complaint.resolutionImage) && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-200 text-emerald-800 text-xs">
                  ✓
                </span>
                Resolution Details
              </div>
              {complaint.resolutionNote && (
                <p className="mt-2 text-sm text-emerald-950 whitespace-pre-line font-normal">
                  {complaint.resolutionNote}
                </p>
              )}

              {complaint.resolutionImage && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-emerald-800 mb-1.5 flex items-center gap-1">
                    <span>📸</span>
                    <span>Resolution Proof / Photo:</span>
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewModal({
                        isOpen: true,
                        imageUrl: complaint.resolutionImage,
                        title: `${complaint.title} - Resolution Proof`
                      })
                    }
                    className="group relative inline-block overflow-hidden rounded-xl border border-emerald-300 bg-white shadow-xs hover:border-emerald-500 focus:outline-none transition cursor-pointer"
                  >
                    <img
                      src={complaint.resolutionImage}
                      alt="Resolution proof"
                      className="h-28 w-44 object-cover group-hover:scale-105 transition duration-200"
                    />
                    <div className="absolute inset-0 bg-emerald-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="rounded-lg bg-white/90 px-2 py-1 text-[11px] font-semibold text-emerald-900 shadow">
                        Enlarge Proof
                      </span>
                    </div>
                  </button>
                </div>
              )}

              {(formattedResolvedDate || complaint.resolvedBy?.name) && (
                <p className="mt-2 text-xs text-emerald-700">
                  Resolved {complaint.resolvedBy?.name ? `by ${complaint.resolvedBy.name}` : ""}{" "}
                  {formattedResolvedDate ? `on ${formattedResolvedDate}` : ""}
                </p>
              )}
            </div>
          )}

        {/* Rejection display for rejected complaints */}
        {complaint.status === "rejected" &&
          (complaint.resolutionNote || complaint.resolutionImage) && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/70 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-800">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-200 text-rose-800 text-xs">
                  ✕
                </span>
                Reason for Rejection
              </div>
              {complaint.resolutionNote && (
                <p className="mt-2 text-sm text-rose-950 whitespace-pre-line font-normal">
                  {complaint.resolutionNote}
                </p>
              )}

              {complaint.resolutionImage && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-rose-800 mb-1.5 flex items-center gap-1">
                    <span>📸</span>
                    <span>Rejection Reference Photo:</span>
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewModal({
                        isOpen: true,
                        imageUrl: complaint.resolutionImage,
                        title: `${complaint.title} - Rejection Reference Photo`
                      })
                    }
                    className="group relative inline-block overflow-hidden rounded-xl border border-rose-300 bg-white shadow-xs hover:border-rose-500 focus:outline-none transition cursor-pointer"
                  >
                    <img
                      src={complaint.resolutionImage}
                      alt="Rejection reference"
                      className="h-28 w-44 object-cover group-hover:scale-105 transition duration-200"
                    />
                    <div className="absolute inset-0 bg-rose-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="rounded-lg bg-white/90 px-2 py-1 text-[11px] font-semibold text-rose-900 shadow">
                        Enlarge Photo
                      </span>
                    </div>
                  </button>
                </div>
              )}

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

              {/* Delete button */}
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

      {/* Action Dialog for Resolution or Rejection with Optional Picture */}
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
              rows={3}
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

          {/* Optional Picture Upload for Secretary / Resolver */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-800">
                {actionModal.status === "resolved" ? "Resolution Photo / Proof" : "Reference Photo"}{" "}
                <span className="text-xs text-slate-400 font-normal">(Optional)</span>
              </label>
              {resolutionImg && (
                <button
                  type="button"
                  onClick={() => setResolutionImg(null)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                >
                  Remove Photo
                </button>
              )}
            </div>

            {!resolutionImg ? (
              <div
                onClick={() => resolutionFileInputRef.current?.click()}
                className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-3.5 text-center cursor-pointer hover:border-blue-400 hover:bg-slate-50 transition"
              >
                <input
                  ref={resolutionFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleResolutionFileChange}
                  className="hidden"
                />
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 mb-1.5 group-hover:scale-105 transition">
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
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  {compressingImg ? "Processing photo..." : "Upload proof or reference picture"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click to choose image</p>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center gap-3">
                <img
                  src={resolutionImg.dataUrl}
                  alt="Resolution attachment preview"
                  className="h-16 w-24 object-cover rounded-lg border border-slate-200"
                />
                <div className="flex-1 min-w-0 text-xs">
                  <p className="font-semibold text-slate-800 truncate">{resolutionImg.name}</p>
                  <p className="text-slate-400 mt-0.5">{formatFileSize(resolutionImg.size)}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-emerald-600">
                    <span>✓</span> Attached
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setResolutionImg(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            )}
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
              disabled={submitting || compressingImg}
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

      {/* Full Size Image Preview Modal / Lightbox */}
      <Modal
        isOpen={previewModal.isOpen}
        title={previewModal.title || "Image Preview"}
        onClose={() => setPreviewModal({ isOpen: false, imageUrl: "", title: "" })}
      >
        <div className="flex flex-col items-center">
          <div className="max-h-[70vh] w-full overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
            <img
              src={previewModal.imageUrl}
              alt={previewModal.title || "Full size preview"}
              className="max-h-[70vh] w-auto max-w-full object-contain"
            />
          </div>
          <div className="mt-3 flex w-full justify-between items-center text-xs text-slate-500">
            <span>{previewModal.title}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewModal({ isOpen: false, imageUrl: "", title: "" })}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default ComplaintCard;
