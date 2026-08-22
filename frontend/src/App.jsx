// FR-01: User Registration
// FR-02: User Login & Session
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicOnlyRoute from "./components/PublicOnlyRoute.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Wardrobe from "./pages/Wardrobe.jsx";
import Recommendations from "./pages/Recommendations.jsx";
import StyleMe from "./pages/StyleMe.jsx";
import OutfitHistory from "./pages/OutfitHistory.jsx";
import OutfitBuilder from "./pages/OutfitBuilder.jsx";
import Analytics from "./pages/Analytics.jsx";
import Profile from "./pages/Profile.jsx";
import Subscription from "./pages/Subscription.jsx";

function CatchAll() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="page">
        <p>Loading...</p>
      </main>
    );
  }

  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

function App() {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Route>

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

        <Route path="*" element={<CatchAll />} />
      </Routes>
    </div>
  );
}

export default App;
