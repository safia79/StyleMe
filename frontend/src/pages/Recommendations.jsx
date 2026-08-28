// FR-04: AI Outfit Recommendation
// FR-05: Weather-Based Filtering (banner + temperature used by mock recommend)

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { apiRequest } from "../api.js";
import WeatherBanner from "../components/WeatherBanner.jsx";
import OutfitResultCard from "../components/OutfitResultCard.jsx";
import { EmptyState, LoadingState } from "../components/StatusPanel.jsx";
import { useToast } from "../ToastContext.jsx";

const OCCASIONS = ["Casual", "Work", "Formal", "Date Night"];

function Recommendations() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [weather, setWeather] = useState(null);
  const [occasion, setOccasion] = useState("");
  const [outfits, setOutfits] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [savedKeys, setSavedKeys] = useState([]);
  const [shortage, setShortage] = useState(null);
  const [ignoreWeather, setIgnoreWeather] = useState(false);
  const [ignoreOccasion, setIgnoreOccasion] = useState(false);
  const [lastFlags, setLastFlags] = useState({ skipWeather: false, skipOccasion: false });

  function handleWeatherChange(nextWeather) {
    setWeather(nextWeather && typeof nextWeather.temperature === "number" ? nextWeather : null);
  }

  function outfitKey(outfit) {
    return (outfit.items || []).map((item) => item.id).join("-");
  }

  async function generateOutfits({ skipWeather = false, skipOccasion = false } = {}) {
    if (loading) return;
    setError("");
    setOutfits([]);
    setShortage(null);
    setLoading(true);

    const withoutWeather = Boolean(skipWeather);
    const withoutOccasion = Boolean(skipOccasion);
    const result = await apiRequest("/api/recommendations/generate", {
      method: "POST",
      body: {
        occasion,
        ignoreWeather: withoutWeather,
        ignoreOccasion: withoutOccasion,
        temperature:
          !withoutWeather && weather && typeof weather.temperature === "number"
            ? weather.temperature
            : null,
        conditions: !withoutWeather && weather && weather.conditions ? weather.conditions : null,
      },
    });

    setLoading(false);
    setLastFlags({ skipWeather: withoutWeather, skipOccasion: withoutOccasion });

    if (!result.ok) {
      setError(result.data.error || "Could not generate an outfit.");
      return;
    }

    if (result.data.shortage) {
      setIgnoreWeather(false);
      setIgnoreOccasion(false);
      setShortage(result.data.shortage);
      return;
    }

    setIgnoreWeather(withoutWeather);
    setIgnoreOccasion(withoutOccasion);
    setOutfits(result.data.outfits || []);
  }

  async function handleGenerate(event) {
    event.preventDefault();
    await generateOutfits({ skipWeather: false, skipOccasion: false });
  }

  async function handleSave(outfit) {
    const key = outfitKey(outfit);
    if (savingId) return;
    setSavingId(key);
    setError("");

    const result = await apiRequest("/api/outfits", {
      method: "POST",
      body: {
        name: outfit.name || "Recommended look",
        occasionTag: outfit.occasionTag || occasion || "Any",
        itemIds: outfit.items.map((item) => item.id),
      },
    });

    setSavingId(null);

    if (!result.ok) {
      setError(result.data.error || "Could not save this outfit.");
      return;
    }

    setSavedKeys((current) => [...current, key]);
    showToast("Outfit saved to your history.");
  }

  return (
    <main className="page page-wide">
      <header className="page-header">
        <div>
          <p className="page-kicker">Daily looks</p>
          <h1>Recommendations</h1>
          <p>Outfit suggestions based on your wardrobe and the weather.</p>
        </div>
      </header>

      <div className="split-layout split-layout-compact">
        <section className="panel-card">
          <h2 className="panel-heading">Today's weather</h2>
          <WeatherBanner city={user?.city} onWeatherChange={handleWeatherChange} />
        </section>
        <form className="panel-card recommend-bar" onSubmit={handleGenerate}>
          <label className="form-field">
            Occasion <span className="optional-tag">(optional)</span>
            <select value={occasion} onChange={(event) => setOccasion(event.target.value)}>
              <option value="">Any</option>
              {OCCASIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? <span className="btn-spinner" aria-hidden="true" /> : null}
            {loading ? "Generating..." : "Generate Outfit"}
          </button>
        </form>
      </div>

      {error ? (
        <p className="form-error" role="alert">
          {error} {error.includes("wardrobe") ? <Link to="/wardrobe">Go to Wardrobe</Link> : null}
        </p>
      ) : null}

      {loading ? <LoadingState message="Finding outfits from your wardrobe..." /> : null}

      {shortage && !loading ? (
        <EmptyState
          title={
            shortage.type === "occasion"
              ? `No matching ${shortage.occasion || occasion || "occasion"} outfit`
              : "Nothing weather-appropriate right now"
          }
          message={shortage.message}
          action={
            shortage.type === "occasion" ? (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() =>
                  generateOutfits({
                    skipWeather: lastFlags.skipWeather,
                    skipOccasion: true,
                  })
                }
              >
                {`Show options without the ${shortage.occasion || occasion || "occasion"} filter`}
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() =>
                  generateOutfits({
                    skipWeather: true,
                    skipOccasion: lastFlags.skipOccasion,
                  })
                }
              >
                Show options without weather filtering
              </button>
            )
          }
        />
      ) : null}

      {!loading && outfits.length === 0 && !error && !shortage ? (
        <EmptyState
          title="No outfits to show yet"
          message="Choose an occasion if you like, then generate a look from the clothes you already own."
        />
      ) : null}

      {ignoreWeather && outfits.length > 0 && !loading ? (
        <p className="placeholder-note" role="status">
          Showing outfits without weather filtering.
        </p>
      ) : null}

      {ignoreOccasion && outfits.length > 0 && !loading ? (
        <p className="placeholder-note" role="status">
          Showing outfits without the {occasion || "occasion"} filter.
        </p>
      ) : null}

      <div className="outfit-list">
        {outfits.map((outfit) => {
          const key = outfitKey(outfit);
          return (
            <OutfitResultCard
              key={key}
              outfit={outfit}
              saved={savedKeys.includes(key)}
              saving={savingId === key}
              onSave={() => handleSave(outfit)}
            />
          );
        })}
      </div>
    </main>
  );
}

export default Recommendations;
