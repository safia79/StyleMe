// FR: Foundation — project setup (no feature logic yet)
import { Link } from "react-router-dom";

function Analytics() {
  return (
    <main className="page">
      <h1>Analytics</h1>
      <p>Wear stats and wardrobe insights.</p>
      <div className="placeholder-note">This page is a placeholder. Feature logic will be added later.</div>
      <p className="form-switch">
        <Link to="/dashboard">Back to Dashboard</Link>
      </p>
    </main>
  );
}

export default Analytics;
