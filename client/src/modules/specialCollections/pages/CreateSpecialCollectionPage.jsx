import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorMessage } from "../../../lib/apiError.js";

import {
  createSpecialCollection,
  getSpecialCollectionSelectionOptions
} from "../api/specialCollection.api.js";

function CreateSpecialCollectionPage() {
  const { societyId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Event",
    amount: "",
    startDate: "",
    dueDate: "",
    paymentInstructions: "",
    imageUrl: "",
    documentUrl: "",
    audienceType: "ALL_FLATS",
    applicableFlatIds: [],
    applicableResidentIds: [],
    status: "DRAFT"
  });

  const [selectionOptions, setSelectionOptions] = useState({
    flats: [],
    residents: []
  });

  const [loading, setLoading] = useState(false);
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (formData.audienceType === "ALL_FLATS") {
      return;
    }

    const loadSelectionOptions = async () => {
      try {
        setSelectionLoading(true);
        setErrorMessage("");

        const data = await getSpecialCollectionSelectionOptions(societyId);

        setSelectionOptions({
          flats: data?.flats || [],
          residents: data?.residents || []
        });
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error, "Unable to load flats and residents."));
      } finally {
        setSelectionLoading(false);
      }
    };

    loadSelectionOptions();
  }, [societyId, formData.audienceType]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleAudienceChange = (event) => {
    const { value } = event.target;

    setFormData((current) => ({
      ...current,
      audienceType: value,
      applicableFlatIds: value === "SELECTED_FLATS" ? current.applicableFlatIds : [],
      applicableResidentIds: value === "SELECTED_RESIDENTS" ? current.applicableResidentIds : []
    }));

    setErrorMessage("");
  };

  const toggleSelection = (field, id) => {
    setFormData((current) => {
      const currentIds = current[field] || [];

      const nextIds = currentIds.includes(id)
        ? currentIds.filter((item) => item !== id)
        : [...currentIds, id];

      return {
        ...current,
        [field]: nextIds
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.audienceType === "SELECTED_FLATS" && formData.applicableFlatIds.length === 0) {
      setErrorMessage("Please select at least one flat.");
      return;
    }

    if (
      formData.audienceType === "SELECTED_RESIDENTS" &&
      formData.applicableResidentIds.length === 0
    ) {
      setErrorMessage("Please select at least one resident.");
      return;
    }

    if (
      formData.startDate &&
      formData.dueDate &&
      new Date(formData.dueDate) < new Date(formData.startDate)
    ) {
      setErrorMessage("Due date cannot be before start date.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const payload = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        paymentInstructions: formData.paymentInstructions.trim(),
        imageUrl: formData.imageUrl.trim(),
        documentUrl: formData.documentUrl.trim(),
        amount: Number(formData.amount),
        applicableFlatIds:
          formData.audienceType === "SELECTED_FLATS" ? formData.applicableFlatIds : [],
        applicableResidentIds:
          formData.audienceType === "SELECTED_RESIDENTS" ? formData.applicableResidentIds : []
      };

      await createSpecialCollection(societyId, payload);

      navigate(`/societies/${societyId}/special-collections`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to create special collection."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Create Special Collection"
      description="Create a one-time payment collection for your society."
      backTo={`/societies/${societyId}/special-collections`}
    >
      <div className="mx-auto max-w-3xl">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_45px_-28px_rgba(15,23,42,0.3)] sm:p-8"
        >
          {errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-900">Something went wrong</p>

              <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          <div>
            <h2 className="text-lg font-bold text-slate-950">Collection details</h2>

            <p className="mt-1 text-sm text-slate-500">Enter the purpose and payment details.</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Title</label>

            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Ganpati Celebration Fund"
              required
              maxLength={100}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Description</label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Explain why this collection is being created."
              maxLength={500}
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Category</label>

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="Event">Event</option>
                <option value="Repair">Repair</option>
                <option value="Emergency Fund">Emergency Fund</option>
                <option value="Building Work">Building Work</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Amount</label>

              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="e.g. 1000"
                min="0.01"
                step="0.01"
                required
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Start date</label>

              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Due date</label>

              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Payment instructions</label>

            <textarea
              name="paymentInstructions"
              value={formData.paymentInstructions}
              onChange={handleChange}
              placeholder="Add any instructions for residents."
              maxLength={1000}
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Audience</label>

            <select
              name="audienceType"
              value={formData.audienceType}
              onChange={handleAudienceChange}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
            >
              <option value="ALL_FLATS">All Flats</option>

              <option value="SELECTED_FLATS">Selected Flats</option>

              <option value="SELECTED_RESIDENTS">Selected Residents</option>
            </select>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Choose who should be responsible for this collection.
            </p>
          </div>

          {formData.audienceType === "SELECTED_FLATS" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Select Flats</h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Select one or more flats for this collection.
                  </p>
                </div>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {formData.applicableFlatIds.length} selected
                </span>
              </div>

              {selectionLoading ? (
                <p className="mt-4 text-sm text-slate-500">Loading flats...</p>
              ) : selectionOptions.flats.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No flats found.</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {selectionOptions.flats.map((flat) => (
                    <label
                      key={flat._id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={formData.applicableFlatIds.includes(flat._id)}
                        onChange={() => toggleSelection("applicableFlatIds", flat._id)}
                        className="h-4 w-4 rounded border-slate-300"
                      />

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Flat {flat.flatNumber}
                        </p>

                        {(flat.floor || flat.wing) && (
                          <p className="text-xs text-slate-500">
                            {flat.wing ? `Wing ${flat.wing}` : ""}
                            {flat.wing && flat.floor ? " • " : ""}
                            {flat.floor ? `Floor ${flat.floor}` : ""}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {formData.audienceType === "SELECTED_RESIDENTS" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Select Residents</h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Select one or more residents for this collection.
                  </p>
                </div>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {formData.applicableResidentIds.length} selected
                </span>
              </div>

              {selectionLoading ? (
                <p className="mt-4 text-sm text-slate-500">Loading residents...</p>
              ) : selectionOptions.residents.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No active residents found.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {selectionOptions.residents.map((resident) => (
                    <label
                      key={resident._id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={formData.applicableResidentIds.includes(resident._id)}
                        onChange={() => toggleSelection("applicableResidentIds", resident._id)}
                        className="h-4 w-4 rounded border-slate-300"
                      />

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {resident.userId?.name || "Unnamed Resident"}
                        </p>

                        <p className="text-xs text-slate-500">
                          Flat {resident.flatId?.flatNumber || "N/A"}
                          {resident.userId?.email ? ` • ${resident.userId.email}` : ""}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Image URL</label>

              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
              />

              {formData.imageUrl && (
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img
                    src={formData.imageUrl}
                    alt="Collection preview"
                    className="h-48 w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Document URL</label>

              <input
                type="url"
                name="documentUrl"
                value={formData.documentUrl}
                onChange={handleChange}
                placeholder="Optional document URL"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate(`/societies/${societyId}/special-collections`)}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || selectionLoading}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Collection"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default CreateSpecialCollectionPage;
