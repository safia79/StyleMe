// FR: Foundation — project setup (no feature logic yet)
import { Link } from "react-router-dom";

function OutfitBuilder() {
  return (
    <main className="page">
      <h1>Outfit Builder</h1>
      <p>Combine wardrobe items into an outfit.</p>
      <div className="placeholder-note">This page is a placeholder. Feature logic will be added later.</div>
      <p className="form-switch">
        You can generate outfits on <Link to="/recommendations">Recommendations</Link> for now.
      </p>
    </main>
  );
}

export default OutfitBuilder;
