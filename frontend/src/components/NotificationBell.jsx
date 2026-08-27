import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { apiRequest } from "../api.js";
import UiIcon from "./UiIcons.jsx";

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
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState(null);
  const menuRef = useRef(null);

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

  useEffect(() => {
    setOpen(false);
    loadNotifications();
  }, [location.pathname]);

  useEffect(() => {
    if (closeWhen) setOpen(false);
  }, [closeWhen]);

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

  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      if (onOpen) onOpen();
      await loadNotifications();
    }
  }

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
