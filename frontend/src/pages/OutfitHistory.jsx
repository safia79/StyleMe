// FR-09: Outfit History
// Saved looks: rename, mark as worn today, or delete (items stay in the closet).

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, imageSrc } from "../api.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { ButtonSpinner, EmptyState, LoadingState } from "../components/StatusPanel.jsx";
import { useToast } from "../ToastContext.jsx";

function OutfitHistory() {
  const { showToast } = useToast();
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // editingId + draftName: which card is being renamed, and the typed name.
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");
  // busyId: which outfit's Wear/Delete request is running.
  const [busyId, setBusyId] = useState(null);
  // pendingDelete: outfit waiting for the confirm dialog (or null).
  const [pendingDelete, setPendingDelete] = useState(null);

  // Load saved outfits once. Ignore the reply if we already left the page.
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

  // Click the title to turn it into an input.
  function startRename(outfit) {
    setEditingId(outfit.id);
    setDraftName(outfit.name);
  }

  // PATCH just the name, then replace that row in the list.
  async function saveRename(outfitId) {
    const name = draftName.trim();
    if (!name) {
      setError("Please enter an outfit name.");
      return;
    }
    if (busyId) return;

    setBusyId(outfitId);
    setError("");
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
    showToast("Outfit renamed.");
  }

  // Enter saves, Escape cancels — same idea as renaming a file.
  function handleRenameKey(event, outfitId) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveRename(outfitId);
    }
    if (event.key === "Escape") {
      setEditingId(null);
    }
  }

  // Mark this look as worn. Also bump wearCount on those pieces in other cards.
  async function handleWear(outfitId) {
    if (busyId) return;
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
    showToast("Marked as worn today.");
  }

  // After the user confirms, DELETE that outfit (wardrobe items are kept).
  async function confirmDelete() {
    if (!pendingDelete || busyId) return;
    const outfit = pendingDelete;
    setBusyId(outfit.id);
    const result = await apiRequest(`/api/outfits/${outfit.id}`, { method: "DELETE" });
    setBusyId(null);

    if (!result.ok) {
      setError(result.data.error || "Could not delete this outfit.");
      setPendingDelete(null);
      return;
    }

    setOutfits((current) => current.filter((row) => row.id !== outfit.id));
    setPendingDelete(null);
    showToast("Outfit deleted.");
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

      {loading ? <LoadingState message="Loading saved outfits..." /> : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && outfits.length === 0 ? (
        <EmptyState
          title="No saved outfits yet"
          message="Generate a look, then save it here to wear again later."
          action={
            <>
              <Link className="btn" to="/recommendations">
                Recommendations
              </Link>
              <Link className="btn btn-secondary" to="/styleme">
                StyleMe
              </Link>
            </>
          }
        />
      ) : null}

      {!loading && outfits.length > 0 ? (
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
                  {busyId === outfit.id ? <ButtonSpinner /> : null}
                  {busyId === outfit.id ? "Saving..." : "Wear Today"}
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  disabled={busyId === outfit.id}
                  onClick={() => setPendingDelete(outfit)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete this outfit?"
          message={`"${pendingDelete.name}" will be removed from history. Your clothing items will stay in the wardrobe.`}
          confirmLabel="Delete outfit"
          busy={busyId === pendingDelete.id}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </main>
  );
}

export default OutfitHistory;
