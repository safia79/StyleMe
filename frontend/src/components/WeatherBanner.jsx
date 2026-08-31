// FR-05: Weather-Based Filtering
// FR-04: exposes temperature to Recommendations via onWeatherChange
// Loads the forecast for the user's city and shows a small banner.
// Recommendations also listen via onWeatherChange so they can filter outfits.

import { useEffect, useState } from "react";
import { fetchCityWeather } from "../weather.js";
import UiIcon from "./UiIcons.jsx";

// Pick which icon to draw from words like "rain" or "clear" in the forecast.
function weatherIconName(conditions) {
  const text = String(conditions || "").toLowerCase();
  if (text.includes("snow") || text.includes("icy")) return "snow";
  if (text.includes("thunder") || text.includes("storm")) return "storm";
  if (text.includes("rain") || text.includes("drizzle") || text.includes("shower")) return "rain";
  if (text.includes("clear")) return "sun";
  return "cloud";
}

function WeatherBanner({ city, onWeatherChange }) {
  const [status, setStatus] = useState(city && city.trim() ? "loading" : "unavailable"); // loading | ok | unavailable
  // weather: the latest forecast object from the API, or null if we have none.
  const [weather, setWeather] = useState(null);

  // Reload whenever the city changes. "cancelled" ignores a stale response
  // if the user navigates away or the city updates mid-request.
  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      try {
        const result = await fetchCityWeather(city);
        if (cancelled) return;
        if (result) {
          setWeather(result);
          setStatus("ok");
          if (onWeatherChange) onWeatherChange(result);
        } else {
          setStatus("unavailable");
          if (onWeatherChange) onWeatherChange(null);
        }
      } catch (err) {
        console.error("Weather data unavailable — caught error:", err);
        if (!cancelled) {
          setStatus("unavailable");
          if (onWeatherChange) onWeatherChange(null);
        }
      }
    }

    if (!city || !String(city).trim()) {
      setStatus("unavailable");
      if (onWeatherChange) onWeatherChange(null);
      return undefined;
    }

    loadWeather();
    return () => {
      cancelled = true;
    };
  }, [city]);

  // Three possible UIs: still fetching, failed / no city, or success.
  if (status === "loading") {
    return <div className="weather-banner weather-banner-muted">Checking the weather...</div>;
  }

  if (status !== "ok" || !weather) {
    return <p className="weather-unavailable">Weather data unavailable</p>;
  }

  const place = weather.country ? `${weather.cityName}, ${weather.country}` : weather.cityName;

  return (
    <div className="weather-banner">
      <span className="weather-glyph">
        <UiIcon name={weatherIconName(weather.conditions)} size={18} />
      </span>
      <div className="weather-banner-copy">
        <strong>{place}</strong>
        <span>
          {weather.temperature}°C · {weather.conditions}
        </span>
      </div>
    </div>
  );
}

export default WeatherBanner;
