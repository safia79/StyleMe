// FR-01: User Registration
// FR-02: User Login & Session
// FR-08: Premium Subscription
// FR-09: Outfit History
// FR-10: Profile & Preferences
// FR-11: Wardrobe Analytics
// FR-12: Manual Outfit Builder
// App.jsx is the site map. It decides which page component to show for each
// URL, and whether that page is public (login/register) or needs a session.
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicOnlyRoute from "./components/PublicOnlyRoute.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Wardrobe from "./pages/Wardrobe.jsx";
import Recommendations from "./pages/Recommendations.jsx";
import StyleMe from "./pages/StyleMe.jsx";
import OutfitHistory from "./pages/OutfitHistory.jsx";
import OutfitBuilder from "./pages/OutfitBuilder.jsx";
import Analytics from "./pages/Analytics.jsx";
import Profile from "./pages/Profile.jsx";
import Subscription from "./pages/Subscription.jsx";

// Shown when the URL does not match any route below (for example /nope).
// After we know if a session exists, send the visitor to a sensible page.
function CatchAll() {
  const { user, loading } = useAuth();

  // Still checking the session cookie — do not redirect yet.
  if (loading) {
    return (
      <main className="page">
        <p>Loading...</p>
      </main>
    );
  }

  // Logged in → home. Guest → login. "replace" avoids a back-button loop.
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

function App() {
  return (
    <div className="app">
      {/* Keyboard users can jump past the navbar. */}
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Navbar />
      <div id="main-content" tabIndex={-1}>
        <Routes>
        {/* Guests only — already-signed-in people get sent to the dashboard. */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Logged-in pages — guests are sent to /login. */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wardrobe" element={<Wardrobe />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/styleme" element={<StyleMe />} />
          <Route path="/outfit-history" element={<OutfitHistory />} />
          <Route path="/outfit-builder" element={<OutfitBuilder />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/subscription" element={<Subscription />} />
        </Route>

        {/* "*" means "any other path" — unknown URLs land here. */}
        <Route path="*" element={<CatchAll />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
