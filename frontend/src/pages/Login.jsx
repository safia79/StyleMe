// FR-02: User Login & Session

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

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
    <main className="page page-narrow">
      <h1>Login</h1>
      <p>Sign in to your StyleME account.</p>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <label className="form-field">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => handleChange("email", event.target.value)}
          />
        </label>

        <label className="form-field">
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={values.password}
            onChange={(event) => handleChange("password", event.target.value)}
          />
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
    </main>
  );
}

export default Login;
