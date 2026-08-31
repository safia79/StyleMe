// FR-05: Weather-Based Filtering
// Open-Meteo is called from the server so the browser does not have to
// reach geocoding-api.open-meteo.com (IPv6-first, often unreachable here).

const dns = require("dns");

// Prefer IPv4 so geocoding does not stall on IPv6-only DNS answers.
dns.setDefaultResultOrder("ipv4first");

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 30 * 60 * 1000; // R02: 30 minutes per city

const weatherCache = new Map(); // cityKey -> { weather, expiresAt }
// If two requests ask for the same city at once, they share one fetch.
const inflight = new Map(); // cityKey -> Promise

// Open-Meteo weather_code numbers → short labels we show in the app.
const WEATHER_LABELS = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Icy fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

// Map a numeric weather code to a label. Unknown codes fall back by range.
function weatherLabel(code) {
  if (WEATHER_LABELS[code]) return WEATHER_LABELS[code];
  if (code >= 50 && code < 60) return "Drizzle";
  if (code >= 60 && code < 70) return "Rain";
  if (code >= 70 && code < 80) return "Snow";
  if (code >= 80 && code < 90) return "Showers";
  if (code >= 90) return "Storm";
  return "Mixed conditions";
}

// fetch() with an abort timer so a hung API does not block the request forever.
function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

// Same city name with different capitalisation still hits the same cache entry.
function cacheKey(city) {
  return city.trim().toLowerCase();
}

// Talk to Open-Meteo: city name → lat/lng, then current temperature + code.
async function fetchCityWeatherUncached(trimmed) {
  const geoUrl = `${GEOCODE_URL}?name=${encodeURIComponent(trimmed)}&count=1&language=en&format=json`;
  console.log("Open-Meteo geocode:", geoUrl);

  const geoRes = await fetchWithTimeout(geoUrl);
  if (!geoRes.ok) {
    const body = await geoRes.text();
    console.error("Open-Meteo geocoding failed:", geoRes.status, body);
    return null;
  }

  const geoData = await geoRes.json();
  const place = geoData.results && geoData.results[0];
  if (!place) {
    console.error("Open-Meteo geocoding returned no results for city:", trimmed);
    return null;
  }

  const weatherUrl = `${FORECAST_URL}?latitude=${place.latitude}&longitude=${place.longitude}&current=${encodeURIComponent("temperature_2m,weather_code")}`;
  console.log("Open-Meteo forecast:", weatherUrl);

  const weatherRes = await fetchWithTimeout(weatherUrl);
  if (!weatherRes.ok) {
    const body = await weatherRes.text();
    console.error("Open-Meteo forecast failed:", weatherRes.status, body);
    return null;
  }

  const weatherData = await weatherRes.json();
  const current = weatherData.current;
  if (!current || current.temperature_2m === undefined) {
    console.error("Open-Meteo forecast missing current.temperature_2m:", weatherData);
    return null;
  }

  return {
    cityName: place.name,
    country: place.country || "",
    temperature: Math.round(current.temperature_2m),
    conditions: weatherLabel(current.weather_code),
  };
}

// Public helper: cached weather for a city, or null if we cannot look it up.
async function fetchCityWeather(city) {
  const trimmed = typeof city === "string" ? city.trim() : "";
  if (!trimmed) {
    console.error("Weather skipped: no city on the account");
    return null;
  }

  const key = cacheKey(trimmed);
  const cached = weatherCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.weather;
  }

  // Reuse the in-progress request instead of hitting Open-Meteo twice.
  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const pending = fetchCityWeatherUncached(trimmed)
    .then((weather) => {
      if (weather) {
        weatherCache.set(key, { weather, expiresAt: Date.now() + CACHE_TTL_MS });
      }
      inflight.delete(key);
      return weather;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, pending);
  return pending;
}

module.exports = { fetchCityWeather };
