// FR-02: User Login & Session
// FR-08: Premium Subscription (upgrade shortcut)
// FR-09: Outfit History (history shortcut)
// FR-10: Profile & Preferences
// FR-11: Wardrobe Analytics
// FR-12: Manual Outfit Builder
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

function ShortcutIcon({ name }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false",
  };

  const paths = {
    wardrobe: (
      <>
        <path d="M4 4h16v16H4z" />
        <path d="M12 4v16" />
        <path d="M8 12h.01" />
        <path d="M16 12h.01" />
      </>
    ),
    recommendations: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </>
    ),
    styleme: (
      <>
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      </>
    ),
    history: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h10" />
      </>
    ),
    subscription: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 19c1.4-3.2 3.8-4.8 7-4.8s5.6 1.6 7 4.8" />
      </>
    ),
    analytics: (
      <>
        <path d="M5 19V10" />
        <path d="M12 19V5" />
        <path d="M19 19v-7" />
      </>
    ),
    builder: (
      <>
        <path d="M4 17l8-12 8 12H4z" />
        <path d="M9.5 17l2.5-4 2.5 4" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function Dashboard() {
  const { user } = useAuth();

  return (
    <main className="page page-wide">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name}.</p>
          <p>You are signed in as {user?.email}.</p>
        </div>
      </header>

      <div className="shortcut-grid">
        <Link className="shortcut-card" to="/wardrobe">
          <span className="shortcut-icon">
            <ShortcutIcon name="wardrobe" />
          </span>
          <strong>Wardrobe</strong>
          <span>Upload and tag clothing</span>
        </Link>
        <Link className="shortcut-card" to="/recommendations">
          <span className="shortcut-icon">
            <ShortcutIcon name="recommendations" />
          </span>
          <strong>Recommendations</strong>
          <span>Generate an outfit</span>
        </Link>
        <Link className="shortcut-card" to="/styleme">
          <span className="shortcut-icon">
            <ShortcutIcon name="styleme" />
          </span>
          <strong>StyleMe</strong>
          <span>Describe a look (premium)</span>
        </Link>
        <Link className="shortcut-card" to="/outfit-history">
          <span className="shortcut-icon">
            <ShortcutIcon name="history" />
          </span>
          <strong>Outfit History</strong>
          <span>Saved looks</span>
        </Link>
        <Link className="shortcut-card" to="/subscription">
          <span className="shortcut-icon">
            <ShortcutIcon name="subscription" />
          </span>
          <strong>Subscription</strong>
          <span>{user?.accountType === "premium" ? "You are premium" : "Upgrade to premium"}</span>
        </Link>
        <Link className="shortcut-card" to="/profile">
          <span className="shortcut-icon">
            <ShortcutIcon name="profile" />
          </span>
          <strong>Profile</strong>
          <span>Name, city, and style preferences</span>
        </Link>
        <Link className="shortcut-card" to="/analytics">
          <span className="shortcut-icon">
            <ShortcutIcon name="analytics" />
          </span>
          <strong>Analytics</strong>
          <span>Wardrobe charts</span>
        </Link>
        <Link className="shortcut-card" to="/outfit-builder">
          <span className="shortcut-icon">
            <ShortcutIcon name="builder" />
          </span>
          <strong>Outfit Builder</strong>
          <span>Build a look by hand</span>
        </Link>
      </div>
    </main>
  );
}

export default Dashboard;
