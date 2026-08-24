// FR-08: Premium Subscription

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { apiRequest } from "../api.js";
import { ButtonSpinner } from "../components/StatusPanel.jsx";
import { useToast } from "../ToastContext.jsx";

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString();
}

function Subscription() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [subscription, setSubscription] = useState(null);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [simulateDecline, setSimulateDecline] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
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
    if (submitting) return;

    const nextErrors = {};
    if (!simulateDecline) {
      if (!cardName.trim()) nextErrors.cardName = "Please enter the name on the card.";
      if (!cardNumber.trim()) nextErrors.cardNumber = "Please enter a card number.";
      if (!expiry.trim()) nextErrors.expiry = "Please enter an expiry date.";
      if (!cvc.trim()) nextErrors.cvc = "Please enter the CVC.";
    }
    setFieldErrors(nextErrors);
    if (nextErrors.cardName || nextErrors.cardNumber || nextErrors.expiry || nextErrors.cvc) {
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
    showToast(result.data.message || "You are now premium.");
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
              onChange={(event) => {
                setCardName(event.target.value);
                setFieldErrors((current) => ({ ...current, cardName: "" }));
              }}
              placeholder="Ada Lovelace"
            />
            {fieldErrors.cardName ? <span className="field-error">{fieldErrors.cardName}</span> : null}
          </label>
          <label className="form-field">
            Card number
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              value={cardNumber}
              onChange={(event) => {
                setCardNumber(event.target.value);
                setFieldErrors((current) => ({ ...current, cardNumber: "" }));
              }}
              placeholder="4242 4242 4242 4242"
            />
            {fieldErrors.cardNumber ? <span className="field-error">{fieldErrors.cardNumber}</span> : null}
          </label>
          <div className="form-grid">
            <label className="form-field">
              Expiry
              <input
                type="text"
                autoComplete="cc-exp"
                value={expiry}
                onChange={(event) => {
                  setExpiry(event.target.value);
                  setFieldErrors((current) => ({ ...current, expiry: "" }));
                }}
                placeholder="12/28"
              />
              {fieldErrors.expiry ? <span className="field-error">{fieldErrors.expiry}</span> : null}
            </label>
            <label className="form-field">
              CVC
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-csc"
                value={cvc}
                onChange={(event) => {
                  setCvc(event.target.value);
                  setFieldErrors((current) => ({ ...current, cvc: "" }));
                }}
                placeholder="123"
              />
              {fieldErrors.cvc ? <span className="field-error">{fieldErrors.cvc}</span> : null}
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
            {submitting ? <ButtonSpinner /> : null}
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
