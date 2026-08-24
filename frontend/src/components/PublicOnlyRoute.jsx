// FR-01: User Registration
// FR-02: User Login & Session
// If the user is already signed in, Register/Login should go to the Dashboard.

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { LoadingState } from "./StatusPanel.jsx";

function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="page">
        <LoadingState message="Loading..." />
      </main>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
