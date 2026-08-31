// FR-02: User Login & Session
// Email/password sign-in page. Also offers "Continue with Google", which
// leaves this React app and goes to the backend OAuth URL.

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import AuthShell, { AuthHighlights } from "../components/AuthShell.jsx";
import { ButtonSpinner } from "../components/StatusPanel.jsx";
import UiIcon from "../components/UiIcons.jsx";

// Simple check: something@something.something
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // values: what the user typed. fieldErrors: per-input messages.
  const [values, setValues] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  // error: message from the server (wrong password, network, …).
  const [error, setError] = useState("");
  // submitting: true while login() is running so we do not send twice.
  const [submitting, setSubmitting] = useState(false);

  // Update one field and clear its error (and the server error).
  function handleChange(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setError("");
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  // Check the form on the client first, then call AuthContext.login.
  async function handleSubmit(event) {
    event.preventDefault(); // stay on this page — no full reload
    if (submitting) return;

    const nextErrors = {};
    if (!values.email.trim()) nextErrors.email = "Please enter your email address.";
    else if (!EMAIL_PATTERN.test(values.email.trim().toLowerCase())) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (!values.password) nextErrors.password = "Please enter your password.";
    setFieldErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setSubmitting(true);
    const result = await login({
      email: values.email,
      password: values.password,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.data.error || "Incorrect email or password. Please try again.");
      return;
    }

    navigate("/dashboard");
  }

  return (
    <AuthShell>
      <p className="page-kicker">Welcome back</p>
      <h1>Login</h1>
      <p>Sign in to your StyleME account.</p>

        <form className="form" onSubmit={handleSubmit} noValidate>
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
                value={values.email}
                onChange={(event) => handleChange("email", event.target.value)}
              />
            </span>
            {fieldErrors.email ? <span className="field-error">{fieldErrors.email}</span> : null}
          </label>

          <label className="form-field">
            <span className="field-label-row">
              Password
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </span>
            <span className="input-with-icon">
              <span className="input-icon">
                <UiIcon name="lock" size={16} />
              </span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={values.password}
                onChange={(event) => handleChange("password", event.target.value)}
              />
            </span>
            {fieldErrors.password ? <span className="field-error">{fieldErrors.password}</span> : null}
          </label>

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? <ButtonSpinner /> : null}
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-or">or</p>
        {/* Real page navigation — OAuth cannot use fetch() or React Router. */}
        <a className="btn btn-secondary" href={`${API_BASE}/api/auth/google`}>
          Continue with Google
        </a>

        <p className="form-switch">
          New to StyleME? <Link to="/register">Create an account</Link>
        </p>

        <AuthHighlights />
    </AuthShell>
  );
}

export default Login;
