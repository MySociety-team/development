import { useState, useRef } from "react";
import Input from "../../../components/common/Input.jsx";
import Textarea from "../../../components/common/Textarea.jsx";
import Select from "../../../components/common/Select.jsx";
import Button from "../../../components/common/Button.jsx";
import { compressMultipleImages, formatFileSize } from "../../../utils/imageCompressor.js";

const CATEGORY_OPTIONS = [
  { value: "PLUMBING", label: "Plumbing" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "SECURITY", label: "Security" },
  { value: "CLEANLINESS", label: "Cleanliness" },
  { value: "SECRETARY", label: "Secretary / Management" },
  { value: "OTHER", label: "Other" }
];

const MAX_IMAGES = 5;

function ComplaintForm({ onSubmit, loading }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    if (images.length + fileList.length > MAX_IMAGES) {
      setError(`You can upload a maximum of ${MAX_IMAGES} pictures.`);
      return;
    }

    try {
      setCompressing(true);
      setError("");
      const compressedResults = await compressMultipleImages(fileList, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.75
      });

      if (compressedResults.length === 0) {
        setError(
          "Could not process the selected image files. Please select valid PNG or JPG files."
        );
        return;
      }

      setImages((prev) => [...prev, ...compressedResults].slice(0, MAX_IMAGES));
    } catch (err) {
      setError(err?.message || "Failed to process images.");
    } finally {
      setCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    onSubmit({
      title: title.trim(),
      category,
      description: description.trim(),
      images: images.map((img) => img.dataUrl)
    });
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

      {/* Picture Attachments Section */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Add Photos{" "}
            <span className="text-xs text-gray-400 font-normal">(Optional, max {MAX_IMAGES})</span>
          </label>
          <span className="text-xs text-gray-500 font-medium">
            {images.length}/{MAX_IMAGES} photos
          </span>
        </div>

        {/* Drop zone / Upload trigger */}
        {images.length < MAX_IMAGES && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition ${
              isDragging
                ? "border-blue-500 bg-blue-50/50"
                : "border-slate-200 bg-slate-50/60 hover:border-blue-400 hover:bg-slate-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-2 group-hover:scale-105 transition">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-xs font-semibold text-slate-700">
              {compressing ? "Processing pictures..." : "Click or drag & drop pictures here"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Supports JPG, PNG, WEBP</p>
          </div>
        )}

        {/* Thumbnail Preview Grid */}
        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm"
              >
                <img
                  src={img.dataUrl}
                  alt={`Attachment ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(idx);
                  }}
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/75 text-white hover:bg-rose-600 transition shadow cursor-pointer"
                  title="Remove image"
                >
                  ✕
                </button>
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-medium text-white backdrop-blur-xs">
                  {formatFileSize(img.size)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading || compressing} disabled={compressing}>
          {compressing ? "Processing Photos..." : "Submit Complaint"}
        </Button>
      </div>
    </form>
  );
}

export default ComplaintForm;
