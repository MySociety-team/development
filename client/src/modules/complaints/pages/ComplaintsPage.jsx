import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router";
import AppShell from "../../../components/common/AppShell.jsx";
import Modal from "../../../components/common/Modal.jsx";
import ConfirmationDialog from "../../../components/common/ConfirmationDialog.jsx";
import EmptyState from "../../../components/common/EmptyState.jsx";
import Button from "../../../components/common/Button.jsx";
import Textarea from "../../../components/common/Textarea.jsx";
import { useAuth } from "../../../modules/auth/hooks/useAuth.js";
import { getSociety } from "../../../modules/societies/api/society.api.js";
import { getApiErrorMessage } from "../../../lib/apiError.js";
import {
  getComplaints,
  createComplaint,
  updateComplaintStatus,
  deleteComplaint
} from "../api/complaint.api.js";
import ComplaintForm from "../components/ComplaintForm.jsx";
import ComplaintCard from "../components/ComplaintCard.jsx";

function ComplaintsPage() {
  const { societyId } = useParams();
  const { user } = useAuth();

  const [society, setSociety] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loadingSociety, setLoadingSociety] = useState(true);

  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [error, setError] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusUpdateTarget, setStatusUpdateTarget] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [decisionComment, setDecisionComment] = useState("");

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    const fetchSocietyInfo = async () => {
      try {
        const data = await getSociety(societyId);
        if (!cancelled) {
          setSociety(data.society);
          setMembership(data.membership);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Could not load society information."));
        }
      } finally {
        if (!cancelled) {
          setLoadingSociety(false);
        }
      }
    };
    fetchSocietyInfo();
    return () => {
      cancelled = true;
    };
  }, [societyId]);

  const loadComplaints = useCallback(async () => {
    await Promise.resolve();
    setLoadingComplaints(true);
    try {
      const data = await getComplaints(societyId);
      setComplaints(data);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load complaints."));
    } finally {
      setLoadingComplaints(false);
    }
  }, [societyId]);

  useEffect(() => {
    const fetchAll = async () => {
      await loadComplaints();
    };
    fetchAll();
  }, [loadComplaints]);

  const handleCreateComplaint = async (formData) => {
    setSubmitting(true);
    try {
      await createComplaint(societyId, formData);
      setIsFormOpen(false);
      await loadComplaints();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to submit complaint."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (complaintId, newStatus, comment) => {
    setUpdatingStatus(true);
    try {
      await updateComplaintStatus(societyId, complaintId, newStatus, comment);
      setStatusUpdateTarget(null);
      await loadComplaints();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update complaint status."));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteComplaint = async () => {
    if (!deleteTargetId) {
      return;
    }
    setDeleting(true);
    try {
      await deleteComplaint(societyId, deleteTargetId);
      await loadComplaints();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete complaint."));
    } finally {
      setDeleteTargetId(null);
      setDeleting(false);
    }
  };

  if (loadingSociety) {
    return (
      <AppShell title="Complaints" backTo={`/societies/${societyId}/dashboard`}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-350 border-t-blue-650" />
        </div>
      </AppShell>
    );
  }

  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === "pending").length;
  const resolvedCount = complaints.filter((c) => c.status === "resolved").length;
  const rejectedCount = complaints.filter((c) => c.status === "rejected").length;

  const filteredComplaints = complaints.filter((c) => {
    if (activeTab === "my") {
      const creatorId = c.userId?._id || c.userId;
      const currentUserId = user?.id || user?._id;
      if (creatorId !== currentUserId) {
        return false;
      }
    }

    if (statusFilter !== "all" && c.status?.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }

    if (categoryFilter !== "all" && c.category?.toUpperCase() !== categoryFilter.toUpperCase()) {
      return false;
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const matchTitle = c.title?.toLowerCase().includes(query);
      const matchDesc = c.description?.toLowerCase().includes(query);
      const matchUser = c.userId?.name?.toLowerCase().includes(query);
      return matchTitle || matchDesc || matchUser;
    }

    return true;
  });

  return (
    <AppShell
      title="Complaints Helpdesk"
      description={`Manage and report society issues for ${society?.name}`}
      backTo={`/societies/${societyId}/dashboard`}
    >
      <div className="mx-auto max-w-6xl space-y-8">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-750 shadow-sm flex items-center justify-between">
            <span className="font-medium">{error}</span>
            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700 font-bold ml-2"
            >
              Close
            </button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Complaints
            </p>
            <h4 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              {totalCount}
            </h4>
            <p className="mt-1 text-xs text-slate-500">Raised in the society</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pending Resolution
            </p>
            <h4 className="mt-2 text-3xl font-extrabold tracking-tight text-yellow-605">
              {pendingCount}
            </h4>
            <p className="mt-1 text-xs text-slate-500 font-medium">Awaiting action</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Resolved Issues
            </p>
            <h4 className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-605">
              {resolvedCount}
            </h4>
            <p className="mt-1 text-xs text-slate-500">Completed successfully</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Rejected Issues
            </p>
            <h4 className="mt-2 text-3xl font-extrabold tracking-tight text-rose-605">
              {rejectedCount}
            </h4>
            <p className="mt-1 text-xs text-slate-500">Declined by secretary</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex rounded-xl bg-slate-100 p-1 self-start">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-lg px-4 py-2 text-xs font-bold tracking-wide transition-all ${
                  activeTab === "all"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                All Complaints
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("my")}
                className={`rounded-lg px-4 py-2 text-xs font-bold tracking-wide transition-all ${
                  activeTab === "my"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                My Complaints
              </button>
            </div>

            <Button onClick={() => setIsFormOpen(true)}>+ Lodge New Complaint</Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 pt-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-105"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2"
              >
                <option value="all">All Categories</option>
                <option value="PLUMBING">Plumbing</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="SECURITY">Security</option>
                <option value="CLEANLINESS">Cleanliness</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {loadingComplaints ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          </div>
        ) : filteredComplaints.length === 0 ? (
          <EmptyState
            title="No complaints found"
            message={
              searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                ? "No complaints match your selected filters. Try clearing your search or filters."
                : "Everything looks clean and tidy! No active complaints have been logged in this society yet."
            }
            action={
              !searchQuery &&
              statusFilter === "all" &&
              categoryFilter === "all" && (
                <Button onClick={() => setIsFormOpen(true)}>Lodge First Complaint</Button>
              )
            }
          />
        ) : (
          <div className="grid gap-4">
            {filteredComplaints.map((complaint) => (
              <ComplaintCard
                key={complaint._id}
                complaint={complaint}
                currentUser={user}
                userRole={membership?.role}
                onStatusUpdate={(id, status) => {
                  setDecisionComment("");
                  setStatusUpdateTarget({ id, status });
                }}
                onDelete={setDeleteTargetId}
              />
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isFormOpen} title="Lodge a New Complaint" onClose={() => setIsFormOpen(false)}>
        <ComplaintForm onSubmit={handleCreateComplaint} loading={submitting} />
      </Modal>

      <ConfirmationDialog
        isOpen={Boolean(deleteTargetId)}
        title="Delete Complaint"
        message="Are you sure you want to permanently delete this complaint? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteComplaint}
        onCancel={() => setDeleteTargetId(null)}
        loading={deleting}
      />

      <Modal
        isOpen={Boolean(statusUpdateTarget)}
        title={statusUpdateTarget?.status === "resolved" ? "Resolve Complaint" : "Reject Complaint"}
        onClose={() => setStatusUpdateTarget(null)}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!decisionComment.trim()) {
              return;
            }
            handleStatusUpdate(statusUpdateTarget.id, statusUpdateTarget.status, decisionComment);
          }}
          className="space-y-4"
        >
          <div>
            <Textarea
              id="resolution-comment"
              name="comment"
              value={decisionComment}
              onChange={(e) => setDecisionComment(e.target.value)}
              label={
                statusUpdateTarget?.status === "resolved"
                  ? "Resolution Details (How is it resolved?)"
                  : "Rejection Reason (Why is it rejected?)"
              }
              placeholder={
                statusUpdateTarget?.status === "resolved"
                  ? "Provide details about the resolution (e.g. Plumber fixed the pipe)..."
                  : "Provide a reason for rejection..."
              }
              required
              maxLength={300}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="submit" loading={updatingStatus}>
              Submit Decision
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

export default ComplaintsPage;
