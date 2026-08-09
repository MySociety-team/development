const statusStyles = {
  complaint: {
    pending: "bg-yellow-100 text-yellow-800",
    resolved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800"
  },

  payment: {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800"
  },

  meeting: {
    scheduled: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800"
  },

  subscription: {
    active: "bg-green-100 text-green-800",
    expired: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800"
  }
};

function StatusBadge({ type, status }) {
  const styles = statusStyles[type]?.[status];
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
        styles || "bg-gray-100 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
}

export default StatusBadge;
