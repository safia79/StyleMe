// FR-05: Weather-Based Filtering
// FR-04: exposes temperature to Recommendations via onWeatherChange

import { useEffect, useState } from "react";
import { fetchCityWeather } from "../weather.js";
import UiIcon from "./UiIcons.jsx";

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
  const [weather, setWeather] = useState(null);

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
      } catch {
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
