import StatusBadge from "../../../components/common/StatusBadge.jsx";

const CATEGORY_COLORS = {
  PLUMBING: "bg-cyan-50 border-cyan-200 text-cyan-700",
  ELECTRICAL: "bg-amber-50 border-amber-200 text-amber-700",
  SECURITY: "bg-rose-50 border-rose-200 text-rose-700",
  CLEANLINESS: "bg-emerald-50 border-emerald-200 text-emerald-700",
  OTHER: "bg-slate-50 border-slate-200 text-slate-600"
};

const CATEGORY_ICONS = {
  PLUMBING: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21.5c-4.5 0-8-3.5-8-8c0-3.7 3.5-7.7 7.2-11.2c.4-.4 1.1-.4 1.5 0c3.7 3.5 7.2 7.5 7.2 11.2c0 4.5-3.5 8-8 8z"
      />
    </svg>
  ),

  ELECTRICAL: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),

  SECURITY: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  ),

  CLEANLINESS: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  ),

  OTHER: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  )
};

function ComplaintCard({ complaint, currentUser, userRole, onStatusUpdate, onDelete }) {
  const isOwner =
    currentUser &&
    (currentUser.id === complaint.userId?._id || currentUser._id === complaint.userId?._id);

  const isSecretary = userRole === "SECRETARY";

  const formattedDate = new Date(complaint.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const category = complaint.category || "OTHER";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
      {/* Complaint Content */}
      <div className="px-5 py-5 sm:px-6">
        {/* Category + Status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                CATEGORY_COLORS[category] || CATEGORY_COLORS.OTHER
              }`}
            >
              {CATEGORY_ICONS[category] || CATEGORY_ICONS.OTHER}
              {category}
            </span>

            <span className="text-xs text-slate-300">•</span>

            <span className="text-xs font-medium text-slate-400">Complaint</span>
          </div>

          <div className="shrink-0">
            <StatusBadge type="complaint" status={complaint.status} />
          </div>
        </div>

        {/* Title + Description */}
        <div className="mt-3">
          <h3 className="text-xl font-bold leading-tight text-slate-900">{complaint.title}</h3>

          <p className="mt-1.5 text-sm leading-6 text-slate-600">{complaint.description}</p>
        </div>

        {/* Resolution / Rejection */}
        {complaint.resolutionComment && (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 ${
              complaint.status === "resolved"
                ? "border-emerald-200 bg-emerald-50/60"
                : "border-rose-200 bg-rose-50/60"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  complaint.status === "resolved"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {complaint.status === "resolved" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z"
                    />
                  </svg>
                )}
              </div>

              <div className="min-w-0">
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest ${
                    complaint.status === "resolved" ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {complaint.status === "resolved" ? "Resolution Details" : "Rejection Reason"}
                </p>

                <p className="mt-1 text-sm font-medium leading-5 text-slate-700">
                  {complaint.resolutionComment}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* User Information */}
          <div className="flex items-center gap-3">
            <img
              src={
                complaint.userId?.avatarUrl ||
                "https://static.vecteezy.com/system/resources/thumbnails/020/937/370/small/user-icon-for-your-website-design-logo-app-ui-free-vector.jpg"
              }
              alt={complaint.userId?.name || "Member"}
              className="h-9 w-9 rounded-full border-2 border-white bg-slate-200 object-cover shadow-sm"
            />

            <div>
              <p className="text-sm font-bold text-slate-800">
                {complaint.userId?.name || "Deleted User"}
              </p>

              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <span>
                  Flat {complaint.flatId?.wing ?? ""}-{complaint.flatId?.flatNumber ?? "N/A"}
                </span>

                <span className="text-slate-300">•</span>

                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Secretary Resolve / Reject */}
            {isSecretary && complaint.status === "pending" && (
              <>
                <button
                  type="button"
                  onClick={() => onStatusUpdate(complaint._id, "resolved")}
                  className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  Resolve
                </button>

                <button
                  type="button"
                  onClick={() => onStatusUpdate(complaint._id, "rejected")}
                  className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
                >
                  Reject
                </button>
              </>
            )}

            {/* Delete */}
            {(isOwner || isSecretary) && (isSecretary || complaint.status === "pending") && (
              <button
                type="button"
                onClick={() => onDelete(complaint._id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                title="Delete Complaint"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplaintCard;
