// FR-12: Manual Outfit Builder

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, imageSrc } from "../api.js";
import { ButtonSpinner, EmptyState, LoadingState } from "../components/StatusPanel.jsx";
import { useToast } from "../ToastContext.jsx";

const SLOTS = [
  { key: "top", label: "Top", categories: ["Top", "Dress"] },
  { key: "bottom", label: "Bottom", categories: ["Bottom"] },
  { key: "shoes", label: "Shoes", categories: ["Shoes"] },
  { key: "outerwear", label: "Outerwear", categories: ["Outerwear"] },
  { key: "accessory1", label: "Accessory 1", categories: ["Accessory"] },
  { key: "accessory2", label: "Accessory 2", categories: ["Accessory"] },
];

const OCCASIONS = ["Casual", "Work", "Formal", "Date Night", "Weekend"];

function OutfitBuilder() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [slots, setSlots] = useState({});
  const [name, setName] = useState("");
  const [occasionTag, setOccasionTag] = useState("Casual");
  const [pickerKey, setPickerKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await apiRequest("/api/wardrobe");
      if (cancelled) return;
      if (!result.ok) {
        setError(result.data.error || "Could not load your wardrobe.");
      } else {
        setItems(result.data.items || []);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), 6000);
    return () => clearTimeout(timer);
  }, [success]);

  const usedIds = useMemo(
    () => new Set(Object.values(slots).filter(Boolean).map((item) => item.id)),
    [slots],
  );

  const filledCount = Object.values(slots).filter(Boolean).length;
  const pickerSlot = SLOTS.find((slot) => slot.key === pickerKey);

  function assignItem(slotKey, item) {
    setSlots((current) => ({ ...current, [slotKey]: item }));
    setPickerKey(null);
    setError("");
    setSuccess("");
  }

  function clearSlot(slotKey) {
    setSlots((current) => {
      const next = { ...current };
      delete next[slotKey];
      return next;
    });
    setError("");
    setSuccess("");
  }

  async function handleSave(event) {
    event.preventDefault();
    if (saving) return;
    setError("");
    setSuccess("");

    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "Please give this outfit a name.";
    if (!occasionTag) nextErrors.occasionTag = "Please choose an occasion tag.";
    if (filledCount < 2) nextErrors.slots = "Please add at least 2 items to save an outfit.";
    setFieldErrors(nextErrors);
    if (nextErrors.name || nextErrors.occasionTag || nextErrors.slots) {
      setError(nextErrors.slots || nextErrors.name || nextErrors.occasionTag);
      return;
    }

    const itemIds = SLOTS.map((slot) => slots[slot.key]?.id).filter(Boolean);

    setSaving(true);
    const result = await apiRequest("/api/outfits", {
      method: "POST",
      body: {
        name: name.trim(),
        occasionTag,
        itemIds,
      },
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.data.error || "Could not save this outfit.");
      return;
    }

    setSuccess("Outfit saved.");
    showToast("Outfit saved to your history.");
    setName("");
    setOccasionTag("Casual");
    setSlots({});
    setFieldErrors({});
  }

  return (
    <main className="page page-wide">
      <header className="page-header">
        <div>
          <p className="page-kicker">Build by hand</p>
          <h1>Outfit Builder</h1>
          <p>Pick pieces for each slot, then save a named look to Outfit History.</p>
        </div>
      </header>

      {loading ? <LoadingState message="Loading your wardrobe..." /> : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          title="Add clothes first"
          message="Outfit Builder needs pieces in your wardrobe before you can fill the slots."
          action={
            <Link className="btn" to="/wardrobe">
              Go to Wardrobe
            </Link>
          }
        />
      ) : null}

      {success ? (
        <p className="toast-banner" role="status">
          {success} View it in <Link to="/outfit-history">Outfit History</Link>.
        </p>
      ) : null}

      {!loading && items.length > 0 ? (
        <>
      <form className="form builder-form" onSubmit={handleSave}>
        <div className="form-grid">
          <label className="form-field">
            Outfit name
            <input
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSuccess("");
                setError("");
                setFieldErrors((current) => ({ ...current, name: "" }));
              }}
              placeholder="Weekend brunch"
            />
            {fieldErrors.name ? <span className="field-error">{fieldErrors.name}</span> : null}
          </label>
          <label className="form-field">
            Occasion tag
            <select
              value={occasionTag}
              onChange={(event) => {
                setOccasionTag(event.target.value);
                setFieldErrors((current) => ({ ...current, occasionTag: "" }));
              }}
            >
              {OCCASIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {fieldErrors.occasionTag ? (
              <span className="field-error">{fieldErrors.occasionTag}</span>
            ) : null}
          </label>
        </div>

        <div className="slot-grid">
          {SLOTS.map((slot) => {
            const chosen = slots[slot.key];
            return (
              <article key={slot.key} className="slot-card">
                <h2>{slot.label}</h2>
                {chosen ? (
                  <>
                    <img src={imageSrc(chosen.imageUrl)} alt={`${chosen.colour} ${chosen.category}`} />
                    <p>
                      {chosen.colour} {chosen.category}
                    </p>
                    <div className="button-row">
                      <button className="btn-secondary" type="button" onClick={() => setPickerKey(slot.key)}>
                        Change
                      </button>
                      <button className="btn-ghost" type="button" onClick={() => clearSlot(slot.key)}>
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <button className="btn-secondary" type="button" onClick={() => setPickerKey(slot.key)}>
                    Choose {slot.label}
                  </button>
                )}
              </article>
            );
          })}
        </div>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <button className="btn" type="submit" disabled={saving || loading || items.length === 0}>
          {saving ? <ButtonSpinner /> : null}
          {saving ? "Saving..." : "Save outfit"}
        </button>
      </form>

      {pickerSlot ? (
        <div className="modal-backdrop" onClick={() => setPickerKey(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Choose {pickerSlot.label}</h2>
              <button className="btn-ghost" type="button" onClick={() => setPickerKey(null)}>
                Close
              </button>
            </div>
            {items.filter(
              (item) => pickerSlot.categories.includes(item.category) && !usedIds.has(item.id),
            ).length === 0 ? (
              <p>No matching unused items in your wardrobe for this slot.</p>
            ) : (
              <div className="item-grid">
                {items
                  .filter(
                    (item) => pickerSlot.categories.includes(item.category) && !usedIds.has(item.id),
                  )
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="item-card"
                      onClick={() => assignItem(pickerSlot.key, item)}
                    >
                      <img src={imageSrc(item.imageUrl)} alt={`${item.colour} ${item.category}`} />
                      <div className="item-card-body">
                        <strong>
                          {item.colour} {item.category}
                        </strong>
                        <span>{item.style}</span>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
      </>
      ) : null}
    </main>
  );
}

export default OutfitBuilder;
