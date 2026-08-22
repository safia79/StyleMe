// FR-02: User Login & Session
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

function Dashboard() {
  const { user } = useAuth();

  return (
    <main className="page">
      <h1>Dashboard</h1>
      <p>Welcome back, {user?.name}.</p>
      <p>You are signed in as {user?.email}.</p>

      <div className="shortcut-grid">
        <Link className="shortcut-card" to="/wardrobe">
          <strong>Wardrobe</strong>
          <span>Upload and tag clothing</span>
        </Link>
        <Link className="shortcut-card" to="/recommendations">
          <strong>Recommendations</strong>
          <span>Generate an outfit</span>
        </Link>
        <Link className="shortcut-card" to="/styleme">
          <strong>StyleMe</strong>
          <span>Describe a look (premium)</span>
        </Link>
        <Link className="shortcut-card" to="/outfit-history">
          <strong>Outfit History</strong>
          <span>Saved looks</span>
        </Link>
      </div>

      <div className="placeholder-note">
        Analytics, Outfit Builder, Profile editing, and Subscription checkout are still placeholders.
      </div>
    </main>
  );
}

export default Dashboard;
