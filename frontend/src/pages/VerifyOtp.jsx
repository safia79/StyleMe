// FR-13: OTP Login Verification (Two-Factor Authentication)
// After email/password succeeds, the backend may ask for a 6-digit code
// before creating a session. userId arrives from Login via location.state.

import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import AuthShell, { AuthHighlights } from "../components/AuthShell.jsx";
import { ButtonSpinner } from "../components/StatusPanel.jsx";
import UiIcon from "../components/UiIcons.jsx";

// FR-13: OTP Login Verification (Two-Factor Authentication)
const CODE_PATTERN = /^\d{6}$/;

// FR-13: OTP Login Verification (Two-Factor Authentication)
function VerifyOtp() {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // FR-13: OTP Login Verification (Two-Factor Authentication) — Google OAuth
  const userId = new URLSearchParams(location.search).get("userId") || location.state?.userId;

  const [code, setCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  // FR-13: OTP Login Verification (Two-Factor Authentication)
  function handleChange(value) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    setError("");
    setStatus("");
    setFieldErrors((current) => ({ ...current, code: "" }));
  }

  // FR-13: OTP Login Verification (Two-Factor Authentication)
  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = {};
    if (!code.trim()) nextErrors.code = "Please enter the 6-digit code.";
    else if (!CODE_PATTERN.test(code.trim())) {
      nextErrors.code = "Please enter a valid 6-digit code.";
    }
    setFieldErrors(nextErrors);
    if (nextErrors.code) return;

    setSubmitting(true);
    const result = await verifyOtp(userId, code.trim());
    setSubmitting(false);

    if (!result.ok) {
      setError(result.data.error || "That code did not work. Please try again.");
      return;
    }

    navigate("/dashboard");
  }

  // FR-13: OTP Login Verification (Two-Factor Authentication)
  async function handleResend() {
    if (resending || submitting) return;
    setError("");
    setStatus("");
    setResending(true);
    const result = await resendOtp(userId);
    setResending(false);

    if (!result.ok) {
      setError(result.data.error || "Could not resend the code. Please try again.");
      return;
    }

    setStatus(result.data.message || "A new code has been sent.");
  }

  // FR-13: OTP Login Verification (Two-Factor Authentication)
  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AuthShell>
      <p className="page-kicker">Almost there</p>
      <h1>Verify code</h1>
      <p>Enter the 6-digit code we sent to finish signing in.</p>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <label className="form-field">
          Verification code
          <span className="input-with-icon">
            <span className="input-icon">
              <UiIcon name="lock" size={16} />
            </span>
            <input
              type="text"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => handleChange(event.target.value)}
            />
          </span>
          {fieldErrors.code ? <span className="field-error">{fieldErrors.code}</span> : null}
        </label>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        {status ? (
          <p className="form-switch" role="status">
            {status}
          </p>
        ) : null}

        <button className="btn" type="submit" disabled={submitting || resending}>
          {submitting ? <ButtonSpinner /> : null}
          {submitting ? "Verifying..." : "Verify and sign in"}
        </button>
      </form>

      <p className="form-switch">
        Did not get a code?{" "}
        <button
          type="button"
          className="forgot-link"
          onClick={handleResend}
          disabled={resending || submitting}
        >
          {resending ? "Sending..." : "Resend code"}
        </button>
      </p>

      <p className="form-switch">
        <Link to="/login">Back to login</Link>
      </p>

      <AuthHighlights />
    </AuthShell>
  );
}

export default VerifyOtp;
