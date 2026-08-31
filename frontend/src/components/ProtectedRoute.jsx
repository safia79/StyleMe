// FR-02: User Login & Session
// Logged-in pages send visitors to /login when there is no valid session.
// A gate around Dashboard, Wardrobe, and the other signed-in pages.

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { LoadingState } from "./StatusPanel.jsx";

function ProtectedRoute() {
  const { user, loading } = useAuth();

  // Wait for /api/auth/me before deciding — otherwise guests flicker to login.
  if (loading) {
    return (
      <main className="page">
        <LoadingState message="Loading..." />
      </main>
    );
  }

  // No session → send them to login. "replace" keeps the back button clean.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // <Outlet /> means "show the child route" (the actual page).
  return <Outlet />;
}

export default ProtectedRoute;
