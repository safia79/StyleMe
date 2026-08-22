// FR: Foundation — placeholder until a later subscription FR
import { Link } from "react-router-dom";

function Subscription() {
  return (
    <main className="page">
      <h1>Subscription</h1>
      <p>Free and premium plan details.</p>
      <div className="placeholder-note">
        Checkout is not built yet. New accounts start as <strong>free</strong>. StyleMe stays locked
        until the account is marked premium. For a local demo, run{" "}
        <code>node scripts/set-premium.js you@example.com</code> from the backend folder, then refresh.
      </div>
      <p className="form-switch">
        <Link to="/dashboard">Back to Dashboard</Link>
      </p>
    </main>
  );
}

export default Subscription;
