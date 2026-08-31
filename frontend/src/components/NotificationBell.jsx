// Bell in the navbar. Loads real notifications from the API and shows a
// red dot only when at least one item is still unread.
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { apiRequest } from "../api.js";
import UiIcon from "./UiIcons.jsx";

// Turn a timestamp into "Just now", "5 minutes ago", etc.
function relativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return "Just now";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return days === 1 ? "1 day ago" : `${days} days ago`;

  return date.toLocaleDateString();
}

function NotificationBell({ onOpen, closeWhen }) {
  const location = useLocation();
  // open: whether the dropdown is visible.
  const [open, setOpen] = useState(false);
  // items: the list from GET /api/notifications.
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // markingId: which row is being marked read (disables double-clicks).
  const [markingId, setMarkingId] = useState(null);
  const menuRef = useRef(null);

  // Fetch the latest list. Called on page change and when the menu opens.
  async function loadNotifications() {
    const result = await apiRequest("/api/notifications");
    if (!result.ok) {
      setError(result.data.error || "Could not load notifications.");
      setItems([]);
      setLoading(false);
      return;
    }

    setError("");
    setItems(result.data.notifications || []);
    setLoading(false);
  }

  // New page → close the menu and refresh the list.
  useEffect(() => {
    setOpen(false);
    loadNotifications();
  }, [location.pathname]);

  // Parent (Navbar) can force-close us when the profile menu or mobile menu opens.
  useEffect(() => {
    if (closeWhen) setOpen(false);
  }, [closeWhen]);

  // Same outside-click / Escape pattern as the profile dropdown.
  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Open or close. Opening also tells Navbar to close the profile menu.
  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      if (onOpen) onOpen();
      await loadNotifications();
    }
  }

  // Click a row to mark it read on the server, then update that row in state.
  async function handleMarkRead(notification) {
    if (notification.isRead || markingId) return;
    setMarkingId(notification.id);

    const result = await apiRequest(`/api/notifications/${notification.id}/read`, {
      method: "POST",
    });
    setMarkingId(null);

    if (!result.ok) {
      return;
    }

    const updated = result.data.notification || { ...notification, isRead: true };
    setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  const unreadCount = items.filter((item) => !item.isRead).length;
  const label = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications";

  return (
    <div className="navbar-bell-menu" ref={menuRef}>
      <button
        type="button"
        className="navbar-bell"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
      >
        <UiIcon name="bell" size={18} />
        {unreadCount > 0 ? <span className="navbar-bell-dot" aria-hidden="true" /> : null}
      </button>

      {open ? (
        <div className="navbar-dropdown navbar-notifications" role="menu">
          {loading ? <p className="navbar-notifications-empty">Loading...</p> : null}

          {!loading && error && items.length === 0 ? (
            <p className="navbar-notifications-empty" role="alert">
              {error}
            </p>
          ) : null}

          {!loading && items.length === 0 && !error ? (
            <p className="navbar-notifications-empty">No notifications yet</p>
          ) : null}

          {!loading && items.length > 0
            ? items.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  role="menuitem"
                  className={`navbar-dropdown-item navbar-notification ${
                    notification.isRead ? "is-read" : "is-unread"
                  }`}
                  disabled={markingId === notification.id}
                  onClick={() => handleMarkRead(notification)}
                >
                  <span>{notification.message}</span>
                  <small>{relativeTime(notification.createdAt)}</small>
                </button>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}

export default NotificationBell;
