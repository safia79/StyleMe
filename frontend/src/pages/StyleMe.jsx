// FR-06: Style Me (Generative AI Prompt)

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { apiRequest } from "../api.js";
import OutfitResultCard from "../components/OutfitResultCard.jsx";
import WeatherBanner from "../components/WeatherBanner.jsx";

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
  const [stats, setStats] = useState({ count: 0, categories: 0 });

  const isPremium = user?.accountType === "premium";

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      const result = await apiRequest("/api/wardrobe");
      if (cancelled || !result.ok) return;
      const items = result.data.items || [];
      const categories = new Set(items.map((item) => item.category).filter(Boolean));
      setStats({ count: items.length, categories: categories.size });
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

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
      <header className="page-header">
        <div>
          <h1>StyleMe</h1>
          <p>Describe an occasion or look and get a styled outfit from your wardrobe.</p>
        </div>
      </header>

      <div className="split-layout">
        <aside className="side-stack">
          <section className="panel-card">
            <h2 className="panel-heading">Today's weather</h2>
            <WeatherBanner city={user?.city} />
          </section>
          <section className="panel-card">
            <h2 className="panel-heading">Your wardrobe</h2>
            <p className="stat-line">
              <strong>{stats.count}</strong> {stats.count === 1 ? "item" : "items"}
            </p>
            <p className="stat-line">
              <strong>{stats.categories}</strong>{" "}
              {stats.categories === 1 ? "category" : "categories"}
            </p>
            <Link className="inline-link" to="/wardrobe">
              Open wardrobe
            </Link>
          </section>
        </aside>

        <div className="main-panel">
          <section className="panel-card">
            <form className="form form-flush" onSubmit={handleSubmit}>
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
          </section>

          {showUpgrade ? (
            <div className="upgrade-prompt">
              <h2>Premium feature</h2>
              <p>
                StyleMe is included with a premium account. Upgrade to describe any look in your own
                words and get a styled outfit plus tips.
              </p>
              <Link className="btn" to="/subscription">
                Upgrade
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
        </div>
      </div>
    </main>
  );
}

export default StyleMe;
