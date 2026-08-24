// FR-02: User Login & Session
// Logged-in pages send visitors to /login when there is no valid session.

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { LoadingState } from "./StatusPanel.jsx";

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="page">
        <LoadingState message="Loading..." />
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
