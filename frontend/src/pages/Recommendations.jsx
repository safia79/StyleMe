// FR-04: AI Outfit Recommendation
// FR-05: Weather-Based Filtering (banner + temperature used by mock recommend)

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { apiRequest } from "../api.js";
import WeatherBanner from "../components/WeatherBanner.jsx";
import OutfitResultCard from "../components/OutfitResultCard.jsx";

const OCCASIONS = ["Casual", "Work", "Formal", "Date Night"];

function Recommendations() {
  const { user } = useAuth();
  const [temperature, setTemperature] = useState(null);
  const [occasion, setOccasion] = useState("");
  const [outfits, setOutfits] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [savedKeys, setSavedKeys] = useState([]);

  function handleWeatherChange(weather) {
    setTemperature(weather && typeof weather.temperature === "number" ? weather.temperature : null);
  }

  function outfitKey(outfit) {
    return (outfit.items || []).map((item) => item.id).join("-");
  }

  async function handleGenerate(event) {
    event.preventDefault();
    setError("");
    setOutfits([]);
    setLoading(true);

    const result = await apiRequest("/api/recommendations/generate", {
      method: "POST",
      body: {
        occasion,
        temperature,
      },
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.data.error || "Could not generate an outfit.");
      return;
    }

    setOutfits(result.data.outfits || []);
  }

  async function handleSave(outfit) {
    const key = outfitKey(outfit);
    setSavingId(key);

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
  }

  return (
    <main className="page page-wide">
      <header className="page-header">
        <div>
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
            {loading ? "Generating..." : "Generate Outfit"}
          </button>
        </form>
      </div>

      {error ? (
        <p className="form-error" role="alert">
          {error} {error.includes("wardrobe") ? <Link to="/wardrobe">Go to Wardrobe</Link> : null}
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
