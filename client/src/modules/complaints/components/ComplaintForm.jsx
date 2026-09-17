import { useState } from "react";
import Input from "../../../components/common/Input.jsx";
import Textarea from "../../../components/common/Textarea.jsx";
import Select from "../../../components/common/Select.jsx";
import Button from "../../../components/common/Button.jsx";

const CATEGORY_OPTIONS = [
  { value: "PLUMBING", label: "Plumbing" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "SECURITY", label: "Security" },
  { value: "CLEANLINESS", label: "Cleanliness" },
  { value: "SECRETARY", label: "Secretary / Management" },
  { value: "OTHER", label: "Other" }
];

function ComplaintForm({ onSubmit, loading }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    onSubmit({ title, category, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div>
        <Input
          id="complaint-title"
          label="Complaint Title"
          placeholder="Brief summary of the issue (e.g. Water leak in lobby)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label
          htmlFor="complaint-category"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Category <span className="text-red-500">*</span>
        </label>
        <Select
          id="complaint-category"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          placeholder="Select category"
        />
        {category === "SECRETARY" && (
          <p className="mt-1 text-xs text-purple-700 bg-purple-50 rounded-lg p-2 border border-purple-200">
            🛡️ <strong>Secretary Complaint</strong>: To protect residents, complaints in this
            category can only be marked as resolved by you (the complainant), not the secretary.
          </p>
        )}
      </div>

      <div>
        <Textarea
          id="complaint-description"
          label="Detailed Description"
          placeholder="Describe the issue in detail, including location, severity, etc."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          maxLength={500}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>
          Submit Complaint
        </Button>
      </div>
    </form>
  );
}

export default ComplaintForm;
