// Forgot password — token is returned by the API until a real email service exists

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api.js";
import AuthShell, { AuthHighlights } from "../components/AuthShell.jsx";
import { ButtonSpinner } from "../components/StatusPanel.jsx";
import UiIcon from "../components/UiIcons.jsx";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // email | token | password | done
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (step !== "done") return undefined;
    const timer = setTimeout(() => navigate("/login"), 2200);
    return () => clearTimeout(timer);
  }, [step, navigate]);

  async function handleRequestToken(event) {
    event.preventDefault();
    if (requesting) return;
    setError("");

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Please enter your email address.");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed.toLowerCase())) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setRequesting(true);

    const result = await apiRequest("/api/auth/forgot-password", {
      method: "POST",
      body: { email: trimmed },
    });

    setRequesting(false);

    if (!result.ok) {
      setError(result.data.error || "Could not generate a reset token.");
      return;
    }

    if (result.data.resetToken) {
      setToken(result.data.resetToken);
      setStep("token");
      return;
    }

    setError(result.data.message || "If that email is registered, a reset token has been generated.");
  }

  function continueToPassword() {
    setStep("password");
    setError("");
  }

  async function handleReset(event) {
    event.preventDefault();
    if (resetting) return;
    setError("");

    if (!password) {
      setPasswordError("Please enter a new password.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordError("");
    setResetting(true);

    const result = await apiRequest("/api/auth/reset-password", {
      method: "POST",
      body: { token, password },
    });
    setResetting(false);

    if (!result.ok) {
      setError(result.data.error || "Could not reset the password.");
      return;
    }

    setStep("done");
  }

  return (
    <AuthShell>
      <p className="page-kicker">Account</p>
        <h1>Forgot password</h1>

        {step === "email" ? (
          <>
            <p>Enter the email on your StyleME account to start a reset.</p>
            <form className="form" onSubmit={handleRequestToken} noValidate>
              <label className="form-field">
                Email
                <span className="input-with-icon">
                  <span className="input-icon">
                    <UiIcon name="mail" size={16} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setEmailError("");
                      setError("");
                    }}
                  />
                </span>
                {emailError ? <span className="field-error">{emailError}</span> : null}
              </label>
              {error ? (
                <p className="form-error" role="alert">
                  {error}
                </p>
              ) : null}
              <button className="btn" type="submit" disabled={requesting}>
                {requesting ? <ButtonSpinner /> : null}
                {requesting ? "Sending..." : "Continue"}
              </button>
            </form>
          </>
        ) : null}

        {step === "token" ? (
          <>
            <p>Use this token to choose a new password.</p>
            <div className="placeholder-note" role="note">
              In a real deployment this would be emailed to you.
            </div>
            <label className="form-field">
              Reset token
              <input type="text" readOnly value={token} aria-label="Reset token" />
            </label>
            <button className="btn" type="button" onClick={continueToPassword}>
              Continue
            </button>
          </>
        ) : null}

        {step === "password" ? (
          <>
            <p>Choose a new password for your account.</p>
            <form className="form" onSubmit={handleReset} noValidate>
              <label className="form-field">
                New password
                <span className="input-with-icon">
                  <span className="input-icon">
                    <UiIcon name="lock" size={16} />
                  </span>
                  <input
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setPasswordError("");
                    }}
                  />
                </span>
              </label>
              <label className="form-field">
                Confirm password
                <span className="input-with-icon">
                  <span className="input-icon">
                    <UiIcon name="lock" size={16} />
                  </span>
                  <input
                    type="password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setPasswordError("");
                    }}
                  />
                </span>
                {passwordError ? <span className="field-error">{passwordError}</span> : null}
              </label>
              {error ? (
                <p className="form-error" role="alert">
                  {error}
                </p>
              ) : null}
              <button className="btn" type="submit" disabled={resetting}>
                {resetting ? <ButtonSpinner /> : null}
                {resetting ? "Updating..." : "Update password"}
              </button>
            </form>
          </>
        ) : null}

        {step === "done" ? (
          <div className="empty-state">
            <h2>Password updated</h2>
            <p>You can now log in with your new password. Taking you back to login...</p>
            <div className="empty-state-action">
              <Link className="btn" to="/login">
                Continue to login
              </Link>
            </div>
          </div>
        ) : null}

        {step !== "done" ? (
          <p className="form-switch">
            Remembered it? <Link to="/login">Back to login</Link>
          </p>
        ) : null}

        <AuthHighlights />
    </AuthShell>
  );
}

export default ForgotPassword;
