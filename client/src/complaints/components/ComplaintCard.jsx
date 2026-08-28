import StatusBadge from "../../components/common/StatusBadge.jsx";

const CATEGORY_COLORS = {
  PLUMBING: "bg-cyan-50 text-cyan-700 border-cyan-150",
  ELECTRICAL: "bg-amber-50 text-amber-700 border-amber-150",
  SECURITY: "bg-rose-50 text-rose-700 border-rose-150",
  CLEANLINESS: "bg-emerald-50 text-emerald-700 border-emerald-150",
  OTHER: "bg-slate-50 text-slate-700 border-slate-200"
};

function ComplaintCard({ complaint, currentUser, userRole, onStatusUpdate, onDelete }) {
  const isOwner = currentUser && (currentUser.id === complaint.userId?._id || currentUser._id === complaint.userId?._id);
  const isSecretary = userRole === "SECRETARY";
  const formattedDate = new Date(complaint.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider border ${CATEGORY_COLORS[complaint.category] || CATEGORY_COLORS.OTHER}`}>
            {complaint.category}
          </span>
          <h3 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {complaint.title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge type="complaint" status={complaint.status} />
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        {complaint.description}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-50 pt-4 text-xs">
        <div className="flex items-center gap-2">
          <img
            src={complaint.userId?.avatarUrl || "https://static.vecteezy.com/system/resources/thumbnails/020/937/370/small/user-icon-for-your-website-design-logo-app-ui-free-vector.jpg"}
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
            {isSecretary && complaint.status === "pending" && (
              <>
                <button
                  type="button"
                  onClick={() => onStatusUpdate(complaint._id, "resolved")}
                  className="rounded-lg bg-emerald-50 px-2.5 py-1.5 font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                >
                  Resolve
                </button>

                <button
                  type="button"
                  onClick={() => onStatusUpdate(complaint._id, "rejected")}
                  className="rounded-lg bg-rose-50 px-2.5 py-1.5 font-semibold text-rose-700 hover:bg-rose-100 transition"
                >
                  Reject
                </button>
              </>
            )}

            {isOwner && !isSecretary && complaint.status === "pending" && (
              <button
                type="button"
                onClick={() => onDelete(complaint._id)}
                className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-650 transition"
                title="Delete Complaint"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {isSecretary && (
              <button
                type="button"
                onClick={() => onDelete(complaint._id)}
                className="rounded-lg bg-slate-150 p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-650 transition"
                title="Delete Complaint"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
