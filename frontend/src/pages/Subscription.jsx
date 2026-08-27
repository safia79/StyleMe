// FR-08: Premium Subscription
// NFR-02: raw card details never reach StyleME's server. Stripe Elements
// renders a hosted iframe for the card fields; the browser talks to Stripe
// directly, and only the resulting PaymentIntent id (a success token) is
// ever sent to our backend in handleCheckoutSuccess/CheckoutForm below.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "../AuthContext.jsx";
import { apiRequest } from "../api.js";
import { ButtonSpinner } from "../components/StatusPanel.jsx";
import { useToast } from "../ToastContext.jsx";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const FREE_FEATURES = [
  { label: "Basic outfit suggestions", included: true },
  { label: "Wardrobe Analytics", included: true },
  { label: "Upload wardrobe items (up to 20 items)", included: true },
];

const PREMIUM_FEATURES = [
  { label: "Unlimited wardrobe items", included: true },
  { label: "Weather information on recommendations", included: true },
  { label: "Style Me — Generative AI", included: true },
  { label: "Wardrobe Analytics", included: true },
];

const PAYMENT_SETUP_UNAVAILABLE =
  "Payment setup is temporarily unavailable — please try again later";

function publicPaymentError(message, fallback = PAYMENT_SETUP_UNAVAILABLE) {
  const text = typeof message === "string" ? message : "";
  if (!text || /sk_(test|live)_|pk_(test|live)_|Expired API Key|Invalid API Key/i.test(text)) {
    return fallback;
  }
  return text;
}

const PRICING = {
  monthly: { amountLabel: "$9.99", period: "/ month" },
  annual: { amountLabel: "$95.88", period: "/ year" },
};

const CARD_ELEMENT_OPTIONS = {
  hidePostalCode: true,
  style: {
    base: {
      fontSize: "16px",
      fontFamily: "inherit",
      color: "#2a2118",
      "::placeholder": { color: "#a39a8d" },
    },
    invalid: { color: "#b3261e" },
  },
};

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString();
}

function CheckoutForm({ billingCycle, clientSecret, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const { showToast } = useToast();
  const [cardName, setCardName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handlePay(event) {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;
    setError("");
    setSubmitting(true);

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: { name: cardName },
      },
    });

    if (stripeError) {
      setError(publicPaymentError(stripeError.message, "Your card was declined."));
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      const result = await apiRequest("/api/subscription/confirm", {
        method: "POST",
        body: { paymentIntentId: paymentIntent.id },
      });
      setSubmitting(false);

      if (!result.ok) {
        setError(publicPaymentError(result.data.error, "We took your payment but couldn't activate Premium. Contact support."));
        return;
      }

      showToast(result.data.message || "You are now premium.");
      onSuccess(result.data.subscription);
    } else {
      setSubmitting(false);
      setError("Payment did not complete. Please try again.");
    }
  }

  return (
    <form className="form checkout-panel" onSubmit={handlePay}>
      <p className="checkout-note">
        Payments are processed securely by Stripe — your card details never touch StyleME's servers.
        Test mode: use <code>4242 4242 4242 4242</code> for a successful charge, or{" "}
        <code>4000 0000 0000 0002</code> to see a decline.
      </p>

      <label className="form-field">
        Name on card
        <input
          type="text"
          autoComplete="cc-name"
          value={cardName}
          onChange={(event) => setCardName(event.target.value)}
          placeholder="Ada Lovelace"
          required
        />
      </label>

      <label className="form-field">
        Card details
        <div className="stripe-card-element">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </label>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="checkout-actions">
        <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button className="btn" type="submit" disabled={!stripe || submitting}>
          {submitting ? <ButtonSpinner /> : null}
          {submitting ? "Processing..." : `Pay ${billingCycle === "annual" ? "$95.88" : "$9.99"}`}
        </button>
      </div>
    </form>
  );
}

function Subscription() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [subscription, setSubscription] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [checkout, setCheckout] = useState(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [trialStarting, setTrialStarting] = useState(false);
  const [trialError, setTrialError] = useState("");
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState("");

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

  async function handleStartCheckout() {
    setStartError("");
    setTrialError("");
    if (!publishableKey) {
      console.error(
        "Stripe publishable key is missing. Add VITE_STRIPE_PUBLISHABLE_KEY to frontend/.env and restart the frontend.",
      );
      setStartError(PAYMENT_SETUP_UNAVAILABLE);
      return;
    }
    setStarting(true);
    const result = await apiRequest("/api/subscription/create-payment-intent", {
      method: "POST",
      body: { billingCycle },
    });
    setStarting(false);

    if (!result.ok) {
      setStartError(publicPaymentError(result.data.error));
      return;
    }
    setCheckout({ clientSecret: result.data.clientSecret });
  }

  async function handleCheckoutSuccess(updatedSubscription) {
    await refreshUser();
    setSubscription(updatedSubscription || null);
    setCheckout(null);
  }

  async function handleStartTrial() {
    setTrialError("");
    setStartError("");
    setTrialStarting(true);
    const result = await apiRequest("/api/subscription/start-trial", { method: "POST" });
    setTrialStarting(false);

    if (!result.ok) {
      setTrialError(result.data.error || "Couldn't start your free trial. Please try again.");
      return;
    }

    showToast(result.data.message || "Your 5-day free trial has started.");
    await refreshUser();
    setSubscription(result.data.subscription || null);
  }

  async function handleCancel() {
    const confirmed = window.confirm(
      "Cancel your Premium subscription? You'll lose access to premium features immediately.",
    );
    if (!confirmed) return;

    setCancelError("");
    setCanceling(true);
    const result = await apiRequest("/api/subscription/cancel", { method: "POST" });
    setCanceling(false);

    if (!result.ok) {
      setCancelError(result.data.error || "Couldn't cancel your subscription. Please try again.");
      return;
    }

    showToast(result.data.message || "Subscription canceled.");
    await refreshUser();
    setSubscription(result.data.subscription || null);
  }

  return (
    <main className="page page-wide subscription-page">
      <header className="page-header">
        <div>
          <p className="page-kicker">Membership</p>
          <h1>Subscription</h1>
          <p>Unlock StyleMe and other premium features.</p>
        </div>
      </header>

      {isPremium ? (
        <section className="panel-card form-page-card">
          <div className="plan-banner plan-banner-premium">
            <strong>
              {subscription?.planStatus === "trialing" ? "Premium (Free Trial)" : "Premium"}
            </strong>
            {subscription?.expiryDate ? (
              <span>Expires {formatDate(subscription.expiryDate)}</span>
            ) : (
              <span>Premium features are unlocked.</span>
            )}
          </div>
          <p>Your premium features are already unlocked. You can use StyleMe without logging in again.</p>
          <p className="form-switch">
            Open <Link to="/styleme">StyleMe</Link> — no extra login needed.
          </p>
          {cancelError ? (
            <p className="form-error" role="alert">
              {cancelError}
            </p>
          ) : null}
          <button className="btn-cancel" type="button" onClick={handleCancel} disabled={canceling}>
            {canceling ? <ButtonSpinner /> : null}
            {canceling ? "Canceling..." : "Cancel subscription"}
          </button>
        </section>
      ) : (
        <section className="panel-card pricing-card">
          <div className="billing-toggle">
            <span className={billingCycle === "monthly" ? "is-active" : ""}>Monthly</span>
            <button
              type="button"
              className={`toggle-switch ${billingCycle === "annual" ? "is-on" : ""}`}
              onClick={() => setBillingCycle((current) => (current === "monthly" ? "annual" : "monthly"))}
              aria-pressed={billingCycle === "annual"}
              aria-label="Toggle annual billing"
            >
              <span className="toggle-knob" />
            </button>
            <span className={billingCycle === "annual" ? "is-active" : ""}>
              Annual <em>(save 20%)</em>
            </span>
          </div>

          <div className="pricing-grid">
            <div className="plan-card">
              <h3>Free</h3>
              <p className="plan-price">
                $0 <span>/ month</span>
              </p>
              <ul className="plan-features">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature.label} className={feature.included ? "" : "plan-feature-disabled"}>
                    <span className="plan-feature-icon">{feature.included ? "✓" : "✕"}</span>
                    {feature.label}
                  </li>
                ))}
              </ul>
              <button className="btn btn-ghost" type="button" disabled>
                Current plan
              </button>
            </div>

            <div className="plan-card plan-card-premium">
              <span className="plan-badge">Popular</span>
              <h3>Premium</h3>
              <p className="plan-price">
                {PRICING[billingCycle].amountLabel} <span>{PRICING[billingCycle].period}</span>
              </p>
              <ul className="plan-features">
                {PREMIUM_FEATURES.map((feature) => (
                  <li key={feature.label}>
                    <span className="plan-feature-icon">✓</span>
                    {feature.label}
                  </li>
                ))}
              </ul>

              {startError ? (
                <p className="form-error" role="alert">
                  {startError}
                </p>
              ) : null}

              <button
                className="btn"
                type="button"
                onClick={handleStartCheckout}
                disabled={starting || trialStarting}
              >
                {starting ? <ButtonSpinner /> : null}
                {starting ? "Loading..." : "Upgrade Now"}
              </button>
              {trialError ? (
                <p className="form-error" role="alert">
                  {trialError}
                </p>
              ) : null}
              <button
                className="btn btn-ghost"
                type="button"
                onClick={handleStartTrial}
                disabled={trialStarting || starting}
              >
                {trialStarting ? <ButtonSpinner /> : null}
                {trialStarting ? "Starting trial..." : "Start 5-day free trial"}
              </button>
              <p className="plan-secure-note">🔒 Secured by Stripe · Cancel anytime</p>
            </div>
          </div>

          {checkout ? (
            <Elements stripe={stripePromise}>
              <CheckoutForm
                billingCycle={billingCycle}
                clientSecret={checkout.clientSecret}
                onSuccess={handleCheckoutSuccess}
                onCancel={() => setCheckout(null)}
              />
            </Elements>
          ) : null}
        </section>
      )}
    </main>
  );
}

export default Subscription;
