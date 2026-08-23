// FR-09: Outfit History

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, imageSrc } from "../api.js";

function OutfitHistory() {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await apiRequest("/api/outfits");
      if (cancelled) return;
      if (!result.ok) {
        setError(result.data.error || "Could not load outfit history.");
      } else {
        setOutfits(result.data.outfits || []);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function startRename(outfit) {
    setEditingId(outfit.id);
    setDraftName(outfit.name);
  }

  async function saveRename(outfitId) {
    const name = draftName.trim();
    if (!name) {
      setError("Please enter an outfit name.");
      return;
    }

    setBusyId(outfitId);
    const result = await apiRequest(`/api/outfits/${outfitId}`, {
      method: "PATCH",
      body: { name },
    });
    setBusyId(null);

    if (!result.ok) {
      setError(result.data.error || "Could not rename this outfit.");
      return;
    }

    setOutfits((current) =>
      current.map((outfit) => (outfit.id === outfitId ? result.data.outfit : outfit)),
    );
    setEditingId(null);
  }

  function handleRenameKey(event, outfitId) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveRename(outfitId);
    }
    if (event.key === "Escape") {
      setEditingId(null);
    }
  }

  async function handleWear(outfitId) {
    setBusyId(outfitId);
    setError("");
    const result = await apiRequest(`/api/outfits/${outfitId}/wear`, { method: "POST" });
    setBusyId(null);

    if (!result.ok) {
      setError(result.data.error || "Could not mark this outfit as worn.");
      return;
    }

    const wornIds = new Set(
      (Array.isArray(result.data.outfit.itemIds) ? result.data.outfit.itemIds : []).map(Number),
    );
    setOutfits((current) =>
      current.map((outfit) => {
        if (outfit.id === outfitId) return result.data.outfit;
        return {
          ...outfit,
          items: (outfit.items || []).map((item) =>
            wornIds.has(item.id) ? { ...item, wearCount: (item.wearCount || 0) + 1 } : item,
          ),
        };
      }),
    );
  }

  async function handleDelete(outfit) {
    const confirmed = window.confirm(
      `Delete "${outfit.name}"? Your clothing items will stay in the wardrobe.`,
    );
    if (!confirmed) return;

    setBusyId(outfit.id);
    const result = await apiRequest(`/api/outfits/${outfit.id}`, { method: "DELETE" });
    setBusyId(null);

    if (!result.ok) {
      setError(result.data.error || "Could not delete this outfit.");
      return;
    }

    setOutfits((current) => current.filter((row) => row.id !== outfit.id));
  }

  return (
    <main className="page page-wide">
      <header className="page-header">
        <div>
          <p className="page-kicker">Saved looks</p>
          <h1>Outfit History</h1>
          <p>Looks you have saved from Recommendations or StyleMe. Newest first.</p>
        </div>
      </header>

      {loading ? <p>Loading saved outfits...</p> : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && outfits.length === 0 ? (
        <div className="placeholder-note">
          No saved outfits yet. Generate one on <Link to="/recommendations">Recommendations</Link> or{" "}
          <Link to="/styleme">StyleMe</Link>.
        </div>
      ) : (
        <div className="outfit-list">
          {outfits.map((outfit) => (
            <article key={outfit.id} className="outfit-card">
              {editingId === outfit.id ? (
                <input
                  className="outfit-name-input"
                  value={draftName}
                  autoFocus
                  onChange={(event) => setDraftName(event.target.value)}
                  onKeyDown={(event) => handleRenameKey(event, outfit.id)}
                  aria-label="Outfit name"
                />
              ) : (
                <h2 className="outfit-title">
                  <button type="button" className="name-button" onClick={() => startRename(outfit)}>
                    {outfit.name}
                  </button>
                </h2>
              )}
              <p>
                {outfit.occasionTag} · Saved {new Date(outfit.createdAt).toLocaleDateString()} · Worn{" "}
                {outfit.wornCount} {outfit.wornCount === 1 ? "time" : "times"}
              </p>
              <div className="outfit-thumbs">
                {(outfit.items || []).map((item) => (
                  <figure key={item.id} className="outfit-thumb">
                    <img src={imageSrc(item.imageUrl)} alt={`${item.colour} ${item.category}`} />
                    <figcaption>
                      {item.colour} {item.category}
                      {item.wearCount ? ` · worn ${item.wearCount}` : ""}
                    </figcaption>
                  </figure>
                ))}
              </div>
              <div className="button-row">
                <button
                  className="btn"
                  type="button"
                  disabled={busyId === outfit.id}
                  onClick={() => handleWear(outfit.id)}
                >
                  Wear Today
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  disabled={busyId === outfit.id}
                  onClick={() => handleDelete(outfit)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default OutfitHistory;
