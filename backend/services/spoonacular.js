const fetch = require("node-fetch");
const { URL } = require("url");
const env = require("../config/env");

const BASE = "https://api.spoonacular.com";
const TTL_MS = 5 * 60 * 1000; // recipe data is static — 5 min is plenty
const MAX_ENTRIES = 500;

// In-memory cache keyed by path + query (never the apiKey). Bounded so a long
// process can't grow it without limit.
const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expires <= Date.now()) { cache.delete(key); return null; }
  return hit.value;
}

function cacheSet(key, value) {
  if (cache.size >= MAX_ENTRIES) {
    // Evict the oldest-inserted entry (Map preserves insertion order).
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { expires: Date.now() + TTL_MS, value });
}

function buildUrl(path, params) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params || {})) {
    if (v != null) url.searchParams.append(k, v);
  }
  url.searchParams.append("apiKey", env.API_KEY);
  return url.toString();
}

// Fetch a Spoonacular endpoint and return { ok, status, data }. Successful JSON
// responses are cached; errors are passed through uncached so a transient
// failure isn't memoised.
async function spoonacular(path, params) {
  const cacheKey = path + "?" + new URLSearchParams(params || {}).toString();
  const cached = cacheGet(cacheKey);
  if (cached) return { ...cached, cached: true };

  const response = await fetch(buildUrl(path, params));
  const result = { ok: response.ok, status: response.status, cached: false };
  if (response.ok) {
    result.data = await response.json();
    cacheSet(cacheKey, result);
  }
  return result;
}

module.exports = { spoonacular };
