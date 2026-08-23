// FR-02: User Login & Session

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import AuthShell, { AuthHighlights } from "../components/AuthShell.jsx";
import UiIcon from "../components/UiIcons.jsx";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault(); // stay on this page — no full reload

    if (!values.email.trim() || !values.password) {
      setError("Incorrect email or password. Please try again.");
      return;
    }

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
      <div className="auth-card">
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
          </label>

          <label className="form-field">
            Password
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
          </label>

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="form-switch">
          New to StyleME? <Link to="/register">Create an account</Link>
        </p>

        <AuthHighlights />
      </div>
    </AuthShell>
  );
}

export default Login;
