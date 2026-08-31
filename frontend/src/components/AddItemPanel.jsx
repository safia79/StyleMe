// FR-03: Clothing Upload & AI Tagging
// Modal for adding a clothing photo: pick file → upload → AI tags → save.

import { useState } from "react";
import { apiRequest, imageSrc, uploadImage } from "../api.js";
import { CATEGORIES, COLOURS, STYLES, FORMALITIES, SEASONS } from "../tagOptions.js";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// One labelled dropdown used for category, colour, style, and so on.
function TagSelect({ label, name, value, options, onChange }) {
  return (
    <label className="form-field">
      {label}
      <select name={name} value={value} onChange={(event) => onChange(name, event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function AddItemPanel({ onClose, onSaved }) {
  const [step, setStep] = useState("pick"); // pick | uploading | analysing | review
  // progress: 0–100 while the file is uploading (for the progress bar).
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  // imageUrl: path the server stored the photo under.
  const [imageUrl, setImageUrl] = useState("");
  // tags: suggested (then editable) clothing labels.
  const [tags, setTags] = useState({
    category: "Top",
    colour: "Black",
    style: "Casual",
    formality: "Casual",
    season: "All-season",
  });
  const [saving, setSaving] = useState(false);
  // dragOver: true while a file is hovered over the drop zone (highlights it).
  const [dragOver, setDragOver] = useState(false);

  // Reject anything that is not a reasonably sized JPG/PNG/WEBP.
  function validateFile(file) {
    if (!file) return "Please choose a JPG, PNG, or WEBP image.";
    const typeOk = ALLOWED_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!typeOk) return "Please upload a JPG, PNG, or WEBP image.";
    if (file.size > MAX_FILE_BYTES) return "Image must be 10MB or smaller.";
    return "";
  }

  // Upload the photo, then jump to the review step with the suggested tags.
  async function handleFile(file) {
    const message = validateFile(file);
    if (message) {
      setError(message);
      return;
    }

    setError("");
    setProgress(0);
    setStep("uploading");

    const result = await uploadImage("/api/wardrobe/upload", file, {
      onProgress: (percent) => {
        setProgress(percent);
        if (percent >= 100) setStep("analysing");
      },
      onUploadComplete: () => setStep("analysing"),
    });

    if (!result.ok) {
      setError(result.data.error || "Could not upload the image. Please try again.");
      setStep("pick");
      return;
    }

    setImageUrl(result.data.imageUrl);
    setTags(result.data.tags);
    setStep("review");
  }

  // Browser would otherwise open the file — we take it and upload instead.
  function handleDrop(event) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    handleFile(file);
  }

  function handleTagChange(name, value) {
    // Keep the other tags; only replace the one dropdown that changed.
    setTags((current) => ({ ...current, [name]: value }));
  }

  // POST the image path + tags to create the wardrobe item.
  async function handleSave(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");

    const result = await apiRequest("/api/wardrobe", {
      method: "POST",
      body: { imageUrl, ...tags },
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.data.error || "Could not save this item.");
      return;
    }

    onSaved(result.data.item);
  }

  return (
    <div
      className="modal-backdrop"
      onClick={() => {
        if (step === "uploading" || step === "analysing" || saving) return;
        onClose();
      }}
    >
      <div className="modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-labelledby="add-item-title">
        <div className="modal-header">
          <h2 id="add-item-title">Add Item</h2>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={step === "uploading" || step === "analysing" || saving}>
            Close
          </button>
        </div>

        {step === "pick" ? (
          <div
            className={`dropzone ${dragOver ? "dropzone-active" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <p>Drag and drop a clothing photo here, or choose a file.</p>
            <p className="dropzone-hint">JPG, PNG, or WEBP, up to 10MB.</p>
            <label className="btn file-btn">
              Choose file
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                hidden
                onChange={(event) => {
                  const file = event.target.files[0];
                  event.target.value = "";
                  if (file) handleFile(file);
                }}
              />
            </label>
            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}

        {step === "uploading" ? (
          <div className="upload-status">
            <p>Uploading photo...</p>
            <div className="progress-track" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p>{progress}%</p>
          </div>
        ) : null}

        {step === "analysing" ? (
          <div className="upload-status">
            {/* MOCK AI — replace with real image recognition API later (see backend/src/mockAi.js) */}
            <p>AI is analysing your item...</p>
            <div className="spinner" aria-hidden="true" />
          </div>
        ) : null}

        {step === "review" ? (
          <form className="form" onSubmit={handleSave}>
            <img className="preview-image" src={imageSrc(imageUrl)} alt="Uploaded clothing item" />
            <p>Suggested tags — change any that look wrong before saving.</p>

            <div className="form-grid">
              <TagSelect label="Category" name="category" value={tags.category} options={CATEGORIES} onChange={handleTagChange} />
              <TagSelect label="Colour" name="colour" value={tags.colour} options={COLOURS} onChange={handleTagChange} />
              <TagSelect label="Style" name="style" value={tags.style} options={STYLES} onChange={handleTagChange} />
              <TagSelect label="Formality" name="formality" value={tags.formality} options={FORMALITIES} onChange={handleTagChange} />
              <TagSelect label="Season" name="season" value={tags.season} options={SEASONS} onChange={handleTagChange} />
            </div>

            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}

            <button className="btn" type="submit" disabled={saving}>
              {saving ? <span className="btn-spinner" aria-hidden="true" /> : null}
              {saving ? "Saving..." : "Save to wardrobe"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export default AddItemPanel;
