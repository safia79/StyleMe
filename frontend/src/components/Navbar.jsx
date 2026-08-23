// FR-02: User Login & Session
// FR-08: Premium Subscription
// FR-09: Outfit History
// FR-10: Profile & Preferences
// FR-11: Wardrobe Analytics
// FR-12: Manual Outfit Builder
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

const appLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/wardrobe", label: "Wardrobe" },
  { to: "/recommendations", label: "Recommendations" },
  { to: "/styleme", label: "StyleMe" },
  { to: "/outfit-history", label: "Outfit History" },
  { to: "/outfit-builder", label: "Outfit Builder" },
  { to: "/analytics", label: "Analytics" },
  { to: "/profile", label: "Profile" },
  { to: "/subscription", label: "Subscription" },
];

function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  async function handleSignOut() {
    await logout();
    setMenuOpen(false);
    navigate("/login");
  }

  // Avoid flashing Register/Login while we check the session cookie
  if (loading) {
    return (
      <nav className="navbar">
        <span className="navbar-brand">StyleME</span>
      </nav>
    );
  }

  const firstName = user?.name ? user.name.split(" ")[0] : "";

  return (
    <nav className={`navbar ${user ? "is-auth" : "is-guest"}`}>
      <div className="navbar-top">
        <NavLink to={user ? "/dashboard" : "/login"} end className="navbar-brand">
          StyleME
        </NavLink>
        {user ? <span className="navbar-user">Hi, {firstName}</span> : null}
        {user ? (
          <button
            type="button"
            className="navbar-toggle"
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        ) : null}
      </div>
      <div className={`navbar-links ${menuOpen ? "is-open" : ""}`}>
        {user ? (
          <>
            {appLinks.map((link) => (
              <NavLink key={link.to} to={link.to}>
                {link.label}
              </NavLink>
            ))}
            <button type="button" className="navbar-signout" onClick={handleSignOut}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/register">Register</NavLink>
            <NavLink to="/login">Login</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
