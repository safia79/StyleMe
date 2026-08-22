// FR-06: Style Me (Generative AI Prompt) — saved looks land here
// FR-04: AI Outfit Recommendation — Save Outfit also writes here

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, imageSrc } from "../api.js";

function OutfitHistory() {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <main className="page page-wide">
      <h1>Outfit History</h1>
      <p>Looks you have saved from Recommendations or StyleMe.</p>

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
              <h2 className="outfit-title">{outfit.name}</h2>
              <p>
                {outfit.occasionTag} · {new Date(outfit.createdAt).toLocaleDateString()}
              </p>
              <div className="outfit-thumbs">
                {(outfit.items || []).map((item) => (
                  <figure key={item.id} className="outfit-thumb">
                    <img src={imageSrc(item.imageUrl)} alt={`${item.colour} ${item.category}`} />
                    <figcaption>
                      {item.colour} {item.category}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default OutfitHistory;
