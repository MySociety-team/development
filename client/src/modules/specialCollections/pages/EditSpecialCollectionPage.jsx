import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import AppShell from "../../../components/common/AppShell.jsx";
import { getSpecialCollection, updateSpecialCollection } from "../api/specialCollection.api.js";

function EditSpecialCollectionPage() {
  const { societyId, collectionId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "OTHER",
    amount: "",
    startDate: "",
    dueDate: "",
    paymentInstructions: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadCollection = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const collection = await getSpecialCollection(societyId, collectionId);

        setFormData({
          title: collection.title || "",
          description: collection.description || "",
          category: collection.category || "OTHER",
          amount: collection.amount || "",
          startDate: collection.startDate ? collection.startDate.slice(0, 10) : "",
          dueDate: collection.dueDate ? collection.dueDate.slice(0, 10) : "",
          paymentInstructions: collection.paymentInstructions || ""
        });
      } catch (error) {
        setErrorMessage(
          error?.response?.data?.message || error?.message || "Failed to load collection"
        );
      } finally {
        setLoading(false);
      }
    };

    loadCollection();
  }, [societyId, collectionId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage("");

      await updateSpecialCollection(societyId, collectionId, {
        ...formData,
        amount: Number(formData.amount)
      });

      navigate(`/societies/${societyId}/special-collections/${collectionId}`);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message || error?.message || "Failed to update collection"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell backTo={`/societies/${societyId}/special-collections/${collectionId}`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-600">Loading collection...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell backTo={`/societies/${societyId}/special-collections/${collectionId}`}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Edit Special Collection
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Update the details of this special collection.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {errorMessage && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Title</label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Category</label>

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="EVENT">Event</option>
                <option value="REPAIR">Repair</option>
                <option value="EMERGENCY_FUND">Emergency Fund</option>
                <option value="BUILDING_WORK">Building Work</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Amount</label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  ₹
                </span>

                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 pl-8 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Start Date
                </label>

                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Due Date</label>

                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Payment Instructions
              </label>

              <textarea
                name="paymentInstructions"
                value={formData.paymentInstructions}
                onChange={handleChange}
                rows="3"
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  navigate(`/societies/${societyId}/special-collections/${collectionId}`)
                }
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

export default EditSpecialCollectionPage;
