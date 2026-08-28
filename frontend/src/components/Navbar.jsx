// FR-02: User Login & Session
// FR-08: Premium Subscription
// FR-09: Outfit History
// FR-10: Profile & Preferences
// FR-11: Wardrobe Analytics
// FR-12: Manual Outfit Builder
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";
import BrandMark from "./BrandMark.jsx";
import UiIcon from "./UiIcons.jsx";

const appLinks = [
  { to: "/wardrobe", label: "Wardrobe" },
  { to: "/recommendations", label: "Recommendations" },
  { to: "/styleme", label: "StyleMe", showPremium: true },
  { to: "/outfit-history", label: "Outfit History" },
  { to: "/outfit-builder", label: "Outfit Builder" },
  { to: "/analytics", label: "Analytics" },
];

function firstInitial(name) {
  const letter = name && name.trim()[0];
  return letter ? letter.toUpperCase() : "?";
}

function firstNameFrom(name) {
  if (!name) return "";
  return name.trim().split(/\s+/)[0] || "";
}

function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!accountOpen) return undefined;

    function handlePointerDown(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setAccountOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountOpen]);

  async function handleSignOut() {
    await logout();
    setMenuOpen(false);
    setAccountOpen(false);
    navigate("/login");
  }

  // Avoid flashing Register/Login while we check the session cookie
  if (loading) {
    return (
      <nav className="navbar">
        <span className="navbar-brand">
          <BrandMark size={26} />
          StyleME
        </span>
      </nav>
    );
  }

  const firstName = firstNameFrom(user?.name);

  return (
    <nav className={`navbar ${user ? "is-auth" : "is-guest"}`}>
      <div className="navbar-brand-group">
        <NavLink to={user ? "/dashboard" : "/login"} end className="navbar-brand">
          <BrandMark size={26} />
          StyleME
        </NavLink>
        {user ? (
          <NavLink to="/dashboard" end className="navbar-home">
            Home
          </NavLink>
        ) : null}
      </div>

      {user ? (
        <button
          type="button"
          className="navbar-toggle"
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
          onClick={() => {
            setMenuOpen((open) => !open);
            setAccountOpen(false);
          }}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      ) : null}

      <div className={`navbar-links ${menuOpen ? "is-open" : ""}`}>
        {user ? (
          appLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={link.showPremium ? "navbar-link-with-badge" : undefined}
            >
              {link.label}
              {link.showPremium ? <span className="premium-badge">Premium</span> : null}
            </NavLink>
          ))
        ) : (
          <>
            <NavLink to="/register">Register</NavLink>
            <NavLink to="/login">Login</NavLink>
          </>
        )}
      </div>

      {user ? (
        <div className="navbar-account">
          <NotificationBell
            onOpen={() => setAccountOpen(false)}
            closeWhen={accountOpen || menuOpen}
          />

          <div className="navbar-account-menu" ref={accountRef}>
            <button
              type="button"
              className="navbar-user-chip"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              onClick={() => {
                setAccountOpen((open) => !open);
              }}
            >
              <span className="navbar-avatar" aria-hidden="true">
                {firstInitial(user.name)}
              </span>
              <span className="navbar-user-name">{firstName}</span>
              <span className={`navbar-chevron ${accountOpen ? "is-open" : ""}`}>
                <UiIcon name="chevron" size={14} />
              </span>
            </button>

            {accountOpen ? (
              <div className="navbar-dropdown" role="menu">
                <NavLink
                  to="/profile"
                  role="menuitem"
                  className="navbar-dropdown-item"
                  onClick={() => setAccountOpen(false)}
                >
                  <span>Profile</span>
                  <small>Settings & preferences</small>
                </NavLink>
                <NavLink
                  to="/subscription"
                  role="menuitem"
                  className="navbar-dropdown-item"
                  onClick={() => setAccountOpen(false)}
                >
                  <span>Subscription</span>
                  <small>Manage plan</small>
                </NavLink>
                <button
                  type="button"
                  role="menuitem"
                  className="navbar-dropdown-item navbar-dropdown-signout"
                  onClick={handleSignOut}
                >
                  <span>Sign Out</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </nav>
  );
}

export default Navbar;
