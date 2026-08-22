// FR-03: Clothing Upload & AI Tagging

import { useState } from "react";
import { apiRequest, imageSrc } from "../api.js";
import { CATEGORIES, COLOURS, STYLES, FORMALITIES, SEASONS } from "../tagOptions.js";

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

function ItemDetailModal({ item, onClose, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [tags, setTags] = useState({
    category: item.category,
    colour: item.colour,
    style: item.style,
    formality: item.formality,
    season: item.season,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function handleTagChange(name, value) {
    setTags((current) => ({ ...current, [name]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const result = await apiRequest(`/api/wardrobe/${item.id}`, {
      method: "PATCH",
      body: tags,
    });

    setBusy(false);

    if (!result.ok) {
      setError(result.data.error || "Could not update this item.");
      return;
    }

    onUpdated(result.data.item);
    setEditing(false);
  }

  async function handleFavourite() {
    setBusy(true);
    setError("");

    const result = await apiRequest(`/api/wardrobe/${item.id}`, {
      method: "PATCH",
      body: { isFavourite: !item.isFavourite },
    });

    setBusy(false);

    if (!result.ok) {
      setError(result.data.error || "Could not update favourite.");
      return;
    }

    onUpdated(result.data.item);
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete this item from your wardrobe?");
    if (!confirmed) return;

    setBusy(true);
    setError("");

    const result = await apiRequest(`/api/wardrobe/${item.id}`, { method: "DELETE" });
    setBusy(false);

    if (!result.ok) {
      setError(result.data.error || "Could not delete this item.");
      return;
    }

    onDeleted(item.id);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-labelledby="item-detail-title">
        <div className="modal-header">
          <h2 id="item-detail-title">Item details</h2>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <img className="preview-image" src={imageSrc(item.imageUrl)} alt={`${item.colour} ${item.category}`} />

        {editing ? (
          <form className="form" onSubmit={handleSave}>
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
            <div className="button-row">
              <button className="btn" type="submit" disabled={busy}>
                {busy ? "Saving..." : "Save changes"}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="item-details">
            <p>
              <strong>Category:</strong> {item.category}
            </p>
            <p>
              <strong>Colour:</strong> {item.colour}
            </p>
            <p>
              <strong>Style:</strong> {item.style}
            </p>
            <p>
              <strong>Formality:</strong> {item.formality}
            </p>
            <p>
              <strong>Season:</strong> {item.season}
            </p>
            <p>
              <strong>Favourite:</strong> {item.isFavourite ? "Yes" : "No"}
            </p>
            <p>
              <strong>Added:</strong> {new Date(item.uploadDate).toLocaleDateString()}
            </p>
            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="button-row">
              <button className="btn" type="button" onClick={() => setEditing(true)} disabled={busy}>
                Edit
              </button>
              <button className="btn btn-secondary" type="button" onClick={handleFavourite} disabled={busy}>
                {item.isFavourite ? "Remove favourite" : "Favourite"}
              </button>
              <button className="btn btn-danger" type="button" onClick={handleDelete} disabled={busy}>
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemDetailModal;
