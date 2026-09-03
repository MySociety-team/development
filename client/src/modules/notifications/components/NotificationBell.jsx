import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  clearAllNotifications,
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead
} from "../api/notification.api.js";

const TYPE_CONFIG = {
  MEETING_SCHEDULED: {
    icon: "📅",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "Meeting"
  },
  MEETING_UPDATED: {
    icon: "🔄",
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
    badge: "Meeting Updated"
  },
  MEETING_CANCELLED: {
    icon: "🚫",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    badge: "Meeting Cancelled"
  },
  COMPLAINT_FILED: {
    icon: "📝",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "Complaint"
  },
  COMPLAINT_RESOLVED: {
    icon: "✅",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badge: "Resolved"
  },
  COMPLAINT_REJECTED: {
    icon: "✕",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    badge: "Rejected"
  },
  MEMBER_JOINED: {
    icon: "👤",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    badge: "Resident"
  },
  GENERAL: {
    icon: "🔔",
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-700",
    badge: "Notice"
  }
};

const formatTimeAgo = (dateInput) => {
  if (!dateInput) {
    return "";
  }
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
};

function NotificationBell({ societyId = null, size = "default" }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "unread"
  const [markingAll, setMarkingAll] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const containerRef = useRef(null);

  // Polling for unread count & auto refresh on focus
  useEffect(() => {
    let cancelled = false;

    const loadCount = async () => {
      try {
        const count = await getUnreadCount({ societyId });
        if (!cancelled) {
          setUnreadCount(count);
        }
      } catch {
        // Ignore background fetch errors
      }
    };

    loadCount();
    const interval = setInterval(loadCount, 30000);

    const handleFocus = () => {
      loadCount();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [societyId, refreshTrigger]);

  // Fetch notifications list when opening dropdown or changing filter
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const loadNotifications = async () => {
      setLoading(true);
      try {
        const data = await getNotifications({
          societyId,
          unreadOnly: filter === "unread",
          limit: 30
        });
        if (!cancelled) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount ?? 0);
        }
      } catch {
        // Ignore error
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [isOpen, filter, societyId, refreshTrigger]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await markAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // Continue navigation regardless
      }
    }

    if (notification.link) {
      setIsOpen(false);
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await markAllAsRead(societyId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => {
        const item = prev.find((n) => n._id === notificationId);
        if (item && !item.read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== notificationId);
      });
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications(societyId);
      setNotifications([]);
      setUnreadCount(0);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  const displayedNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="relative" ref={containerRef} onClick={(e) => e.stopPropagation()}>
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={
          size === "sm"
            ? "relative flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus:outline-none cursor-pointer"
            : "relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
        }
        aria-label="View notifications"
        title="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          stroke="currentColor"
          className={size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5"}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span
            className={
              size === "sm"
                ? "absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs ring-1 ring-white animate-pulse"
                : "absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse"
            }
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 px-3 pt-2 bg-white gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`pb-2 px-2 transition-colors cursor-pointer ${
                filter === "all"
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`pb-2 px-2 transition-colors cursor-pointer ${
                filter === "unread"
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification Items List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="flex h-36 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-lg">
                  🔔
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {filter === "unread"
                    ? "You are completely caught up!"
                    : "When meetings are scheduled or complaints are updated, you will see them here."}
                </p>
              </div>
            ) : (
              displayedNotifications.map((item) => {
                const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.GENERAL;
                return (
                  <div
                    key={item._id}
                    onClick={() => handleNotificationClick(item)}
                    className={`group relative flex items-start gap-3 p-3.5 text-left transition hover:bg-slate-50 cursor-pointer ${
                      !item.read ? "bg-blue-50/30" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm shadow-2xs ${config.bg} ${config.border}`}
                    >
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs font-bold leading-tight ${
                            !item.read ? "text-slate-950" : "text-slate-700"
                          }`}
                        >
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                        <span
                          className={`inline-block rounded-md px-1.5 py-0.5 font-medium border ${config.bg} ${config.border} ${config.text}`}
                        >
                          {config.badge}
                        </span>

                        {item.societyId?.name && (
                          <span className="text-slate-400 truncate max-w-[140px]">
                            {item.societyId.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions & Unread Indicator */}
                    <div className="flex flex-col items-center gap-2 self-center shrink-0">
                      {!item.read && <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />}

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, item._id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                        title="Delete notification"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                Showing {displayedNotifications.length} notification
                {displayedNotifications.length === 1 ? "" : "s"}
              </span>

              <button
                type="button"
                onClick={handleClearAll}
                className="font-medium text-slate-500 hover:text-rose-600 transition cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
