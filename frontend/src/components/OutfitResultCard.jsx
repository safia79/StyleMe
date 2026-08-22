// FR-04: AI Outfit Recommendation
// FR-06: Style Me (Generative AI Prompt)

import { imageSrc } from "../api.js";

function OutfitResultCard({ outfit, onSave, saved, saving }) {
  return (
    <article className="outfit-card">
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
      <p className="outfit-rationale">{outfit.rationale}</p>
      {outfit.tips && outfit.tips.length > 0 ? (
        <ul className="outfit-tips">
          {outfit.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      ) : null}
      <button className="btn" type="button" onClick={onSave} disabled={saved || saving}>
        {saved ? "Saved" : saving ? "Saving..." : "Save Outfit"}
      </button>
    </article>
  );
}

export default OutfitResultCard;
