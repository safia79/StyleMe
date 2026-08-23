// FR-03: Clothing Upload & AI Tagging (Add Item)
// FR-07: Wardrobe Dashboard (grid, search, filters, edit/favourite/delete)

import { useEffect, useMemo, useState } from "react";
import { apiRequest, imageSrc } from "../api.js";
import { CATEGORIES, COLOURS, SEASONS } from "../tagOptions.js";
import AddItemPanel from "../components/AddItemPanel.jsx";
import ItemDetailModal from "../components/ItemDetailModal.jsx";

function Wardrobe() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [colour, setColour] = useState("");
  const [season, setSeason] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);

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

  function handleSaved(item) {
    setItems((current) => [item, ...current]);
    setShowAdd(false);
  }

  function handleUpdated(updated) {
    setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelected(updated);
  }

  function handleDeleted(id) {
    setItems((current) => current.filter((item) => item.id !== id));
    setSelected(null);
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

      {loading ? <p>Loading your wardrobe...</p> : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="placeholder-note">No items yet. Click Add Item to upload your first piece.</div>
      ) : null}

      {!loading && items.length > 0 && visibleItems.length === 0 ? (
        <div className="placeholder-note">No items match your search. Try clearing the filters.</div>
      ) : null}

      {visibleItems.length > 0 ? (
        <div className="item-grid">
          {visibleItems.map((item) => (
            <button key={item.id} type="button" className="item-card" onClick={() => setSelected(item)}>
              <img src={imageSrc(item.imageUrl)} alt={`${item.colour} ${item.category}`} />
              <div className="item-card-body">
                <strong>
                  {item.colour} {item.category}
                  {item.isFavourite ? " ★" : ""}
                </strong>
                <span>
                  {item.style} · {item.season}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : null}

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
