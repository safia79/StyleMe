// FR-05: Weather-Based Filtering
// Calls our backend, which talks to Open-Meteo. If anything fails, callers
// should show "Weather data unavailable" instead of crashing.
// Small helper used by WeatherBanner (and anything else that needs a city forecast).

import { apiRequest } from "./api.js";

// Look up today's weather for a city name. Returns weather data or null.
export async function fetchCityWeather(city) {
  const trimmed = typeof city === "string" ? city.trim() : "";
  if (!trimmed) {
    console.error("Weather skipped: no city on the logged-in user");
    return null;
  }

  const result = await apiRequest(`/api/weather?city=${encodeURIComponent(trimmed)}`);
  if (!result.ok) {
    console.error("Weather data unavailable — API error:", result.status, result.data);
    return null;
  }

  return result.data.weather || null;
}
