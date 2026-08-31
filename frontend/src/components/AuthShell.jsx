// Shared split-screen layout for Login, Register, and Forgot Password.
// Left: the white form card (children). Right: decorative art panel.
import BrandMark from "./BrandMark.jsx";
import UiIcon from "./UiIcons.jsx";

// Feature chips shown under each auth form.
const HIGHLIGHTS = [
  { icon: "wardrobe", label: "Wardrobe" },
  { icon: "sparkle", label: "AI outfits" },
  { icon: "weather", label: "Weather" },
  { icon: "shield", label: "Privacy" },
];

// Row of small icons (Wardrobe, AI outfits, …) at the bottom of the card.
export function AuthHighlights() {
  return (
    <ul className="auth-features">
      {HIGHLIGHTS.map((item) => (
        <li key={item.label}>
          <span className="auth-feature-icon">
            <UiIcon name={item.icon} size={16} />
          </span>
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

// children = the page-specific form (headings, inputs, buttons).
function AuthShell({ children }) {
  return (
    <main className="auth-shell">
      <section className="auth-form-col">
        <div className="auth-card">
          <div className="auth-brand">
            <BrandMark size={32} />
            <span>StyleME</span>
          </div>
          {children}
        </div>
      </section>
      <aside className="auth-art" aria-hidden="true">
        <div className="auth-art-pattern" />
        <span className="auth-orb auth-orb-a" />
        <span className="auth-orb auth-orb-b" />
        <span className="auth-ring" />
        <div className="auth-art-copy">
          <p className="auth-art-kicker">Your closet, considered</p>
          <h2>Looks that feel like you</h2>
          <p>Weather-aware outfits from the clothes you already own.</p>
        </div>
        <div className="auth-illustration">
          <svg viewBox="0 0 280 220" className="auth-hanger">
            <path
              d="M140 28c8 0 14 6 14 14 0 6-4 11-10 13v8h-8v-8c-6-2-10-7-10-13 0-8 6-14 14-14z"
              fill="#F3EFE9"
            />
            <path
              d="M70 68h140c-18 8-38 14-70 14S88 76 70 68z"
              fill="#E4DDD3"
            />
            <path
              d="M88 82h104v96c0 10-8 18-18 18H106c-10 0-18-8-18-18V82z"
              fill="#F0E2D8"
            />
            <path d="M140 82v114" stroke="#E4DDD3" strokeWidth="2" />
            <path
              d="M108 118h24M148 118h24M116 142h20M148 142h16"
              stroke="#8C3A1E"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.45"
            />
            <circle cx="54" cy="150" r="22" fill="#E4DDD3" opacity="0.7" />
            <circle cx="226" cy="96" r="16" fill="#F0E2D8" />
            <circle cx="238" cy="168" r="10" fill="#8C3A1E" opacity="0.35" />
          </svg>
        </div>
        <svg className="auth-wave" viewBox="0 0 800 180" preserveAspectRatio="none">
          <path
            d="M0 72C150 18 250 128 400 78C560 24 660 132 800 64V180H0Z"
            fill="#F3EFE9"
            opacity="0.28"
          />
          <path
            d="M0 108C170 48 290 150 450 96C600 48 710 148 800 102V180H0Z"
            fill="#E4DDD3"
            opacity="0.55"
          />
        </svg>
      </aside>
    </main>
  );
}

export default AuthShell;
