// FR-06: Style Me (Generative AI Prompt)

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { apiRequest } from "../api.js";
import OutfitResultCard from "../components/OutfitResultCard.jsx";

const MAX_PROMPT = 300;

function StyleMe() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [outfit, setOutfit] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const isPremium = user?.accountType === "premium";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setOutfit(null);
    setSaved(false);

    const text = prompt.trim();
    if (!text) {
      setError("Please describe the occasion or look you want.");
      return;
    }

    if (!isPremium) {
      setShowUpgrade(true);
      return;
    }

    setShowUpgrade(false);
    setLoading(true);
    const result = await apiRequest("/api/styleme/generate", {
      method: "POST",
      body: { prompt: text },
    });
    setLoading(false);

    if (!result.ok) {
      if (result.data.upgrade) {
        setShowUpgrade(true);
      }
      setError(result.data.error || "Could not create a look.");
      return;
    }

    setOutfit(result.data.outfit);
  }

  async function handleSave() {
    if (!outfit) return;
    setSaving(true);
    setError("");

    const result = await apiRequest("/api/outfits", {
      method: "POST",
      body: {
        name: outfit.name || "StyleMe look",
        occasionTag: outfit.occasionTag || "Custom",
        itemIds: outfit.items.map((item) => item.id),
      },
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.data.error || "Could not save this look.");
      return;
    }

    setSaved(true);
  }

  return (
    <main className="page page-wide">
      <h1>StyleMe</h1>
      <p>Describe an occasion or look and get a styled outfit from your wardrobe.</p>

      <form className="form" onSubmit={handleSubmit}>
        <label className="form-field">
          What are you dressing for?
          <textarea
            rows="4"
            maxLength={MAX_PROMPT}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value.slice(0, MAX_PROMPT))}
            placeholder="e.g. Dinner date on a rainy night, smart but not too formal"
          />
          <span className="char-counter">
            {prompt.length}/{MAX_PROMPT}
          </span>
        </label>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Styling..." : "Style me"}
        </button>
      </form>

      {showUpgrade ? (
        <div className="upgrade-prompt">
          <h2>Premium feature</h2>
          <p>
            StyleMe is included with a premium account. Upgrade to describe any look in your own
            words and get a styled outfit plus tips.
          </p>
          <Link className="btn" to="/subscription">
            View subscription options
          </Link>
        </div>
      ) : null}

      {error && !showUpgrade ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {outfit ? (
        <div className="outfit-list">
          <OutfitResultCard outfit={outfit} onSave={handleSave} saved={saved} saving={saving} />
          {saved ? (
            <p className="form-switch">
              Saved. View it in <Link to="/outfit-history">Outfit History</Link>.
            </p>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}

export default StyleMe;
