// FR-02: User Login & Session
// FR-08: Premium Subscription (upgrade shortcut)
// FR-09: Outfit History (history shortcut)
// FR-10: Profile & Preferences
// FR-11: Wardrobe Analytics
// FR-12: Manual Outfit Builder
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { apiRequest, imageSrc } from "../api.js";
import WeatherBanner from "../components/WeatherBanner.jsx";
import UiIcon from "../components/UiIcons.jsx";

const SHORTCUTS = [
  {
    to: "/wardrobe",
    icon: "wardrobe",
    title: "Wardrobe",
    description: "Upload and tag clothing",
    cta: "Open wardrobe",
  },
  {
    to: "/recommendations",
    icon: "recommendations",
    title: "Recommendations",
    description: "Generate an outfit",
    cta: "Get a look",
  },
  {
    to: "/styleme",
    icon: "sparkle",
    title: "StyleMe",
    description: "Describe a look (premium)",
    cta: "Describe a look",
  },
  {
    to: "/outfit-history",
    icon: "history",
    title: "Outfit History",
    description: "Saved looks",
    cta: "View history",
  },
  {
    to: "/subscription",
    icon: "subscription",
    title: "Subscription",
    descriptionKey: "subscription",
    cta: "Manage plan",
  },
  {
    to: "/profile",
    icon: "user",
    title: "Profile",
    description: "Name, city, and style preferences",
    cta: "Edit profile",
  },
  {
    to: "/analytics",
    icon: "analytics",
    title: "Analytics",
    description: "Wardrobe charts",
    cta: "See charts",
  },
  {
    to: "/outfit-builder",
    icon: "builder",
    title: "Outfit Builder",
    description: "Build a look by hand",
    cta: "Start building",
  },
];

function Dashboard() {
  const { user } = useAuth();
  const [recentOutfits, setRecentOutfits] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadRecent() {
      const result = await apiRequest("/api/outfits");
      if (cancelled || !result.ok) return;
      const outfits = result.data.outfits || [];
      setRecentOutfits(outfits.slice(0, 3));
    }

    loadRecent();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="page page-wide">
      <div className="dashboard-hero">
        <header className="page-header">
          <div>
            <p className="page-kicker">Overview</p>
            <h1>Dashboard</h1>
            <p>Welcome back, {user?.name}.</p>
            <p>You are signed in as {user?.email}.</p>
          </div>
        </header>

        <section className="panel-card weather-summary-card">
          <div className="weather-summary-label">
            <span className="shortcut-icon weather-summary-icon">
              <UiIcon name="weather" size={20} />
            </span>
            <h2 className="panel-heading">Today&apos;s weather</h2>
          </div>
          <WeatherBanner city={user?.city} />
        </section>
      </div>

      <div className="shortcut-grid">
        {SHORTCUTS.map((item) => (
          <Link className="shortcut-card" to={item.to} key={item.to}>
            <span className="shortcut-icon">
              <UiIcon name={item.icon} size={22} />
            </span>
            <strong>{item.title}</strong>
            <span>
              {item.descriptionKey === "subscription"
                ? user?.accountType === "premium"
                  ? "You are premium"
                  : "Upgrade to premium"
                : item.description}
            </span>
            <span className="shortcut-cta">
              {item.cta}
              <UiIcon name="arrow" size={14} />
            </span>
          </Link>
        ))}
      </div>

      {recentOutfits.length > 0 ? (
        <section className="section-block">
          <div className="section-heading">
            <h2>Recent Recommendations</h2>
            <Link to="/outfit-history">View all</Link>
          </div>
          <div className="recent-grid">
            {recentOutfits.map((outfit) => (
              <Link className="recent-card" to="/outfit-history" key={outfit.id}>
                <div className="recent-thumbs">
                  {(outfit.items || []).slice(0, 4).map((item) => (
                    <img
                      key={item.id}
                      src={imageSrc(item.imageUrl)}
                      alt={`${item.colour} ${item.category}`}
                    />
                  ))}
                </div>
                <strong>{outfit.name}</strong>
                <span>
                  {outfit.occasionTag}
                  {outfit.createdAt ? ` · ${new Date(outfit.createdAt).toLocaleDateString()}` : ""}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

export default Dashboard;
