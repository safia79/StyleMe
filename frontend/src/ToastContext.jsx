// Short pop-up messages (for example "Item saved") that appear at the
// bottom of the screen. Any page can call showToast() through useToast().
import { createContext, useContext, useEffect, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  // toast: the message currently on screen, or null if nothing is showing.
  const [toast, setToast] = useState(null);

  // Start (or replace) a toast. The id changes so the hide-timer restarts.
  function showToast(message) {
    if (!message) return;
    setToast({ message, id: Date.now() });
  }

  // After 3.5 seconds, hide the toast. Cleanup cancels the timer if it changes.
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Only draw the banner when there is a message to show. */}
      {toast ? (
        <div className="app-toast" role="status">
          {toast.message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

// Lets a page say: const { showToast } = useToast();
export function useToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return value;
}
