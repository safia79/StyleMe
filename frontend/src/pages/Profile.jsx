// FR-10: Profile & Preferences
// Edit name, city, and style checkboxes. Email is shown but cannot be changed.

import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import { apiRequest } from "../api.js";
import { ButtonSpinner, LoadingState } from "../components/StatusPanel.jsx";
import { useToast } from "../ToastContext.jsx";

const STYLE_OPTIONS = ["Casual", "Formal", "Sporty", "Smart-Casual", "Minimalist", "Streetwear"];

function Profile() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [city, setCity] = useState(user?.city || "");
  // stylePreferences: list of selected style labels from the checkboxes.
  const [stylePreferences, setStylePreferences] = useState([]);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load the saved profile once so the form starts with server values.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await apiRequest("/api/profile");
      if (cancelled) return;
      if (!result.ok) {
        setError(result.data.error || "Could not load your profile.");
      } else {
        const profile = result.data.user;
        setName(profile.name || "");
        setCity(profile.city || "");
        setStylePreferences(profile.stylePreferences || []);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide the green success banner after a few seconds.
  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  // Add the style if it is off, or remove it if it is already on.
  function togglePreference(option) {
    setStylePreferences((current) =>
      current.includes(option) ? current.filter((value) => value !== option) : [...current, option],
    );
    setSuccess("");
    setError("");
  }

  // PATCH the profile, then refresh AuthContext so the navbar name updates.
  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (saving) return;
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "Please enter your name.";
    if (!city.trim()) nextErrors.city = "Please enter your city.";
    setFieldErrors(nextErrors);
    if (nextErrors.name || nextErrors.city) return;

    setSaving(true);
    const result = await apiRequest("/api/profile", {
      method: "PATCH",
      body: {
        name,
        city,
        stylePreferences,
      },
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.data.error || "Could not save your profile.");
      return;
    }

    await refreshUser();
    setSuccess(result.data.message || "Profile saved.");
    showToast(result.data.message || "Profile saved.");
  }

  if (loading) {
    return (
      <main className="page page-wide">
        <p className="page-kicker">Account</p>
        <h1>Profile</h1>
        <LoadingState message="Loading your settings..." />
      </main>
    );
  }

  return (
    <main className="page page-wide">
      <header className="page-header">
        <div>
          <p className="page-kicker">Account</p>
          <h1>Profile</h1>
          <p>Update your display name, city, and style preferences. Changes apply without leaving this page.</p>
        </div>
      </header>

      <section className="panel-card form-page-card">

      {success ? (
        <p className="toast-banner" role="status">
          {success}
        </p>
      ) : null}

      <form className="form" onSubmit={handleSave}>
        <label className="form-field">
          Display name
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSuccess("");
              setError("");
              setFieldErrors((current) => ({ ...current, name: "" }));
            }}
          />
          {fieldErrors.name ? <span className="field-error">{fieldErrors.name}</span> : null}
        </label>

        <label className="form-field">
          Email
          <input type="email" value={user?.email || ""} disabled />
        </label>

        <label className="form-field">
          City
          <input
            type="text"
            autoComplete="address-level2"
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              setSuccess("");
              setError("");
              setFieldErrors((current) => ({ ...current, city: "" }));
            }}
          />
          {fieldErrors.city ? <span className="field-error">{fieldErrors.city}</span> : null}
        </label>

        <fieldset className="pref-fieldset">
          <legend>Style preferences</legend>
          <p className="checkout-note">Choose as many as you like. These are saved with your profile.</p>
          <div className="pref-grid">
            {STYLE_OPTIONS.map((option) => (
              <label key={option} className="check-row">
                <input
                  type="checkbox"
                  checked={stylePreferences.includes(option)}
                  onChange={() => togglePreference(option)}
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        <p>
          Account type: <strong>{user?.accountType}</strong>
        </p>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <button className="btn" type="submit" disabled={saving}>
          {saving ? <ButtonSpinner /> : null}
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
      </section>
    </main>
  );
}

export default Profile;
