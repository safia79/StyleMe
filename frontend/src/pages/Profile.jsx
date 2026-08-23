// FR-10: Profile & Preferences

import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import { apiRequest } from "../api.js";

const STYLE_OPTIONS = ["Casual", "Formal", "Sporty", "Smart-Casual", "Minimalist", "Streetwear"];

function Profile() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [city, setCity] = useState(user?.city || "");
  const [stylePreferences, setStylePreferences] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  function togglePreference(option) {
    setStylePreferences((current) =>
      current.includes(option) ? current.filter((value) => value !== option) : [...current, option],
    );
    setSuccess("");
    setError("");
  }

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!city.trim()) {
      setError("Please enter your city.");
      return;
    }

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
  }

  if (loading) {
    return (
      <main className="page page-narrow">
        <h1>Profile</h1>
        <p>Loading your settings...</p>
      </main>
    );
  }

  return (
    <main className="page page-narrow">
      <h1>Profile</h1>
      <p>Update your display name, city, and style preferences. Changes apply without leaving this page.</p>

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
            }}
          />
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
            }}
          />
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
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </main>
  );
}

export default Profile;
