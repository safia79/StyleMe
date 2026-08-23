// FR-08: Premium Subscription

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { apiRequest } from "../api.js";

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString();
}

function Subscription() {
  const { user, refreshUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [simulateDecline, setSimulateDecline] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isPremium = user?.accountType === "premium";

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      const result = await apiRequest("/api/subscription/status");
      if (cancelled || !result.ok) return;
      setSubscription(result.data.subscription || null);
    }

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [isPremium]);

  async function handleCheckout(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!simulateDecline && (!cardName.trim() || !cardNumber.trim() || !expiry.trim() || !cvc.trim())) {
      setError("Please fill in the card details, or tick the box to demo a declined card.");
      return;
    }

    setSubmitting(true);
    const result = await apiRequest("/api/subscription/checkout", {
      method: "POST",
      body: {
        cardName,
        cardNumber,
        expiry,
        cvc,
        simulateDecline,
      },
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.data.error || "Checkout failed.");
      return;
    }

    await refreshUser();
    setSubscription(result.data.subscription || null);
    setSuccess(result.data.message || "You are now premium.");
    setCardName("");
    setCardNumber("");
    setExpiry("");
    setCvc("");
    setSimulateDecline(false);
  }

  return (
    <main className="page page-wide">
      <header className="page-header">
        <div>
          <p className="page-kicker">Membership</p>
          <h1>Subscription</h1>
          <p>Unlock StyleMe and other premium features.</p>
        </div>
      </header>

      <section className="panel-card form-page-card">

      <div className={`plan-banner ${isPremium ? "plan-banner-premium" : ""}`}>
        <strong>{isPremium ? "Premium" : "Free"}</strong>
        {isPremium && subscription?.expiryDate ? (
          <span>Expires {formatDate(subscription.expiryDate)}</span>
        ) : isPremium ? (
          <span>Premium features are unlocked.</span>
        ) : (
          <span>StyleMe stays locked until you upgrade.</span>
        )}
      </div>

      {success ? <p className="form-success">{success}</p> : null}

      {isPremium && !success ? (
        <p>Your premium features are already unlocked. You can use StyleMe without logging in again.</p>
      ) : null}

      {!isPremium ? (
        <form className="form" onSubmit={handleCheckout}>
          {/* MOCK PAYMENT — replace with real Stripe/payment integration later */}
          <p className="checkout-note">
            Demo checkout only — nothing is charged. Any fake card succeeds. Tick the decline box or
            use <code>4000000000000002</code> to see “Your card was declined”.
          </p>

          <label className="form-field">
            Name on card
            <input
              type="text"
              autoComplete="cc-name"
              value={cardName}
              onChange={(event) => setCardName(event.target.value)}
              placeholder="Ada Lovelace"
            />
          </label>
          <label className="form-field">
            Card number
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              value={cardNumber}
              onChange={(event) => setCardNumber(event.target.value)}
              placeholder="4242 4242 4242 4242"
            />
          </label>
          <div className="form-grid">
            <label className="form-field">
              Expiry
              <input
                type="text"
                autoComplete="cc-exp"
                value={expiry}
                onChange={(event) => setExpiry(event.target.value)}
                placeholder="12/28"
              />
            </label>
            <label className="form-field">
              CVC
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-csc"
                value={cvc}
                onChange={(event) => setCvc(event.target.value)}
                placeholder="123"
              />
            </label>
          </div>

          <label className="check-row">
            <input
              type="checkbox"
              checked={simulateDecline}
              onChange={(event) => setSimulateDecline(event.target.checked)}
            />
            Simulate declined card (demo the failure path)
          </label>

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Processing..." : "Upgrade to Premium"}
          </button>
        </form>
      ) : null}

      <p className="form-switch">
        After upgrading, open <Link to="/styleme">StyleMe</Link> — no extra login needed.
      </p>
      </section>
    </main>
  );
}

export default Subscription;
