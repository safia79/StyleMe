// FR-08: Premium Subscription
// MOCK PAYMENT — replace with real Stripe/payment integration later
// This never talks to a bank. It only checks a demo decline flag / test card.

function mockCharge({ cardNumber, simulateDecline }) {
  const digits = String(cardNumber || "").replace(/\s/g, "");

  if (simulateDecline || digits === "4000000000000002") {
    return {
      ok: false,
      error: "Your card was declined",
    };
  }

  return {
    ok: true,
    customerRef: `cus_mock_${Date.now()}`,
  };
}

module.exports = { mockCharge };
