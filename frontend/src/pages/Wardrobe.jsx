// FR-03: Clothing Upload & AI Tagging (Add Item)
// FR-07: Wardrobe Dashboard (grid, search, filters, edit/favourite/delete)
// Closet grid: search/filter items, add a photo, open details, heart a piece.

import { useEffect, useMemo, useState } from "react";
import { apiRequest, imageSrc } from "../api.js";
import { CATEGORIES, COLOURS, SEASONS } from "../tagOptions.js";
import AddItemPanel from "../components/AddItemPanel.jsx";
import ItemDetailModal from "../components/ItemDetailModal.jsx";
import { EmptyState, LoadingState } from "../components/StatusPanel.jsx";
import UiIcon from "../components/UiIcons.jsx";
import { useToast } from "../ToastContext.jsx";

function Wardrobe() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // search + dropdowns: only used to filter the grid, not sent to the API.
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [colour, setColour] = useState("");
  const [season, setSeason] = useState("");
  // showAdd / selected: which modal is open (add panel vs item details).
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  // favouritingId: which heart is spinning so we do not toggle two at once.
  const [favouritingId, setFavouritingId] = useState(null);

  // Load the full wardrobe once when this page opens.
  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      const result = await apiRequest("/api/wardrobe");
      if (cancelled) return;

      if (!result.ok) {
        setError(result.data.error || "Could not load your wardrobe.");
      } else {
        setItems(result.data.items || []);
      }
      setLoading(false);
    }

    loadItems();
    return () => {
      cancelled = true;
    };
  }, []);

  // Recalculate the filtered list only when items or filters change.
  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      if (category && item.category !== category) return false;
      if (colour && item.colour !== colour) return false;
      if (season && item.season !== season) return false;
      if (!query) return true;

      const haystack = [item.category, item.colour, item.style, item.formality, item.season]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [items, search, category, colour, season]);

  // Replace one item in the list (and in the open modal, if it is that item).
  function applyItem(updated) {
    setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelected((current) => (current && current.id === updated.id ? updated : current));
  }

  // Add Item just succeeded — put the new piece at the front of the grid.
  function handleSaved(item) {
    setItems((current) => [item, ...current]);
    setShowAdd(false);
    showToast("Item saved to your wardrobe.");
  }

  // Edit or favourite from the modal — keep the grid in sync.
  function handleUpdated(updated, message) {
    applyItem(updated);
    if (message) showToast(message);
  }

  function handleDeleted(id) {
    // Remove that card and close the modal.
    setItems((current) => current.filter((item) => item.id !== id));
    setSelected(null);
    showToast("Item deleted from your wardrobe.");
  }

  // Flip the heart immediately, then ask the server. If it fails, undo.
  async function handleFavouriteClick(item) {
    if (favouritingId) return;

    const previous = item.isFavourite;
    const optimistic = { ...item, isFavourite: !previous };
    applyItem(optimistic);
    setFavouritingId(item.id);

    const result = await apiRequest(`/api/wardrobe/${item.id}/favourite`, { method: "POST" });
    setFavouritingId(null);

    if (!result.ok) {
      applyItem(item);
      setError(result.data.error || "Could not update favourite.");
      return;
    }

    applyItem(result.data.item);
    showToast(result.data.item.isFavourite ? "Added to favourites." : "Removed from favourites.");
  }

  return (
    <main className="page page-wide">
      <div className="page-header">
        <div>
          <p className="page-kicker">Your closet</p>
          <h1>Wardrobe</h1>
          <p>View and manage your uploaded clothing items.</p>
        </div>
        <button className="btn" type="button" onClick={() => setShowAdd(true)}>
          Add Item
        </button>
      </div>

      <div className="wardrobe-toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Search items..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select value={colour} onChange={(event) => setColour(event.target.value)} aria-label="Filter by colour">
          <option value="">All colours</option>
          {COLOURS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select value={season} onChange={(event) => setSeason(event.target.value)} aria-label="Filter by season">
          <option value="">All seasons</option>
          {SEASONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {loading ? <LoadingState message="Loading your wardrobe..." /> : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          title="Your wardrobe is empty"
          message="Upload your first piece to start building looks."
          action={
            <button className="btn" type="button" onClick={() => setShowAdd(true)}>
              Add Item
            </button>
          }
        />
      ) : null}

      {!loading && items.length > 0 && visibleItems.length === 0 ? (
        <EmptyState
          title="No matching items"
          message="Nothing matches your search. Try clearing the filters."
        />
      ) : null}

      {visibleItems.length > 0 ? (
        <div className="item-grid">
          {visibleItems.map((item) => (
            <article key={item.id} className="item-card">
              <button type="button" className="item-card-hit" onClick={() => setSelected(item)}>
                <span className="item-card-media">
                  <img src={imageSrc(item.imageUrl)} alt={`${item.colour} ${item.category}`} />
                </span>
                <span className="item-card-body">
                  <strong>
                    {item.colour} {item.category}
                  </strong>
                  <span>
                    {item.style} · {item.season}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className={`fav-toggle ${item.isFavourite ? "is-on" : ""}`}
                aria-pressed={item.isFavourite}
                aria-label={item.isFavourite ? "Remove favourite" : "Add to favourites"}
                disabled={favouritingId === item.id}
                onClick={() => handleFavouriteClick(item)}
              >
                {favouritingId === item.id ? (
                  <span className="btn-spinner fav-spinner" />
                ) : (
                  <UiIcon name={item.isFavourite ? "heartFilled" : "heart"} size={16} />
                )}
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {/* Modals only mount when needed so they do not sit hidden in the DOM. */}
      {showAdd ? <AddItemPanel onClose={() => setShowAdd(false)} onSaved={handleSaved} /> : null}
      {selected ? (
        <ItemDetailModal
          key={selected.id}
          item={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      ) : null}
    </main>
  );
}

export default Wardrobe;
