// FR-01: User Registration

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validateField(field, value) {
  const text = typeof value === "string" ? value.trim() : "";

  if (field === "name") {
    if (!text) return "Please enter your name.";
    return "";
  }

  if (field === "email") {
    if (!text) return "Please enter your email address.";
    if (!EMAIL_PATTERN.test(text.toLowerCase())) return "Please enter a valid email address.";
    return "";
  }

  if (field === "password") {
    if (!value) return "Please enter a password.";
    if (value.length < MIN_PASSWORD_LENGTH) return "Password must be at least 8 characters.";
    return "";
  }

  return "";
}

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setServerError("");

    // Real-time inline validation as the user types
    if (field !== "city") {
      setErrors((current) => ({
        ...current,
        [field]: validateField(field, value),
      }));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault(); // stay on this page — no full reload

    const nextErrors = {
      name: validateField("name", values.name),
      email: validateField("email", values.email),
      password: validateField("password", values.password),
    };
    setErrors(nextErrors);

    if (nextErrors.name || nextErrors.email || nextErrors.password) {
      return;
    }

    setSubmitting(true);
    const result = await register({
      name: values.name,
      email: values.email,
      password: values.password,
      city: values.city,
    });
    setSubmitting(false);

    if (!result.ok) {
      setServerError(result.data.error || "Could not create your account. Please try again.");
      return;
    }

    navigate("/dashboard");
  }

  return (
    <main className="page page-narrow">
      <h1>Register</h1>
      <p>Create a StyleME account.</p>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <label className="form-field">
          Name
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(event) => handleChange("name", event.target.value)}
          />
          {errors.name ? <span className="field-error">{errors.name}</span> : null}
        </label>

        <label className="form-field">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => handleChange("email", event.target.value)}
          />
          {errors.email ? <span className="field-error">{errors.email}</span> : null}
        </label>

        <label className="form-field">
          Password
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(event) => handleChange("password", event.target.value)}
          />
          {errors.password ? <span className="field-error">{errors.password}</span> : null}
        </label>

        <label className="form-field">
          City <span className="optional-tag">(optional)</span>
          <input
            type="text"
            name="city"
            autoComplete="address-level2"
            value={values.city}
            onChange={(event) => handleChange("city", event.target.value)}
          />
        </label>

        {serverError ? (
          <p className="form-error" role="alert">
            {serverError}
          </p>
        ) : null}

        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="form-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </main>
  );
}

export default Register;
