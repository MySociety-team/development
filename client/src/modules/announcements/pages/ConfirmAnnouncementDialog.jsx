function ConfirmAnnouncementDialog({ open, onConfirm, onCancel, loading = false }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-announcement-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_25px_70px_-20px_rgba(15,23,42,0.45)]"
      >
        {/* Dialog content */}
        <div className="flex items-start gap-4">
          {/* Warning icon */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86l-7.2 12.5A2 2 0 004.82 19h14.36a2 2 0 001.73-2.64l-7.2-12.5a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>

          {/* Text */}
          <div>
            <h2 id="delete-announcement-title" className="text-lg font-bold text-slate-950">
              Delete announcement?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete this announcement? This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmAnnouncementDialog;
