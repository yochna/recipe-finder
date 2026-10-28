// const BASE = 'https://saffron-stove-backend.onrender.com/api';

// export async function searchRecipes({ query, cuisine, diet, type, number = 12 }) {
//   const params = new URLSearchParams({ query, number });
//   if (cuisine) params.append('cuisine', cuisine);
//   if (diet)    params.append('diet', diet);
//   if (type)    params.append('type', type);

//   const res = await fetch(`https://saffron-stove-backend.onrender.com/api/recipes?${params}`, { credentials: 'include' });
//   if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Error ${res.status}`); }
//   return (await res.json()).results || [];
// }

// export async function getFavorites() {
//   const res = await fetch(`https://saffron-stove-backend.onrender.com/api/favorites`, { credentials: 'include' });
//   if (!res.ok) throw new Error('Failed to load favorites');
//   return res.json();
// }

// export async function addFavorite(recipe) {
//   const res = await fetch(`https://saffron-stove-backend.onrender.com/api/favorites`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     credentials: 'include',
//     body: JSON.stringify(recipe),
//   });
//   if (!res.ok && res.status !== 409) throw new Error('Failed to save');
//   return res.json();
// }

// export async function removeFavorite(id) {
//   const res = await fetch(`https://saffron-stove-backend.onrender.com/api/favorites/${id}`, {
//     method: 'DELETE',
//     credentials: 'include',
//   });
//   if (!res.ok) throw new Error('Failed to remove');
//   return res.json();
// }



/**
 * api.js
 * All endpoints are explicitly hardcoded to include the /api prefix
 * to prevent Vercel build-time path resolution errors.
 */

const BASE = process.env.REACT_APP_API_URL || 'https://saffron-stove-backend.onrender.com';

export async function searchRecipes({ query, cuisine, diet, type, number = 12 }) {
  const params = new URLSearchParams({ query, number });
  if (cuisine) params.append('cuisine', cuisine);
  if (diet)    params.append('diet', diet);
  if (type)    params.append('type', type);

  const res = await fetch(`${BASE}/api/recipes?${params}`, { 
    credentials: 'include' 
  });
  
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Error ${res.status}`);
  }
  return (await res.json()).results || [];
}

export async function getFavorites() {
  const res = await fetch(`${BASE}/api/favorites`, { 
    credentials: 'include' 
  });
  
  if (!res.ok) throw new Error('Failed to load favorites');
  return res.json();
}

export async function addFavorite(recipe) {
  const res = await fetch(`${BASE}/api/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(recipe),
  });
  
  if (!res.ok && res.status !== 409) throw new Error('Failed to save');
  return res.json();
}

export async function removeFavorite(id) {
  const res = await fetch(`${BASE}/api/favorites/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!res.ok) throw new Error('Failed to remove');
  return res.json();
}

// ── Fridge Scan ──

export async function scanIngredients(dataUrl) {
  const res = await fetch(`${BASE}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ image: dataUrl }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Error ${res.status}`);
  }
  return (await res.json()).ingredients || [];
}

export async function getRecipesByIngredients(ingredients) {
  const params = new URLSearchParams({ ingredients: ingredients.join(', ') });
  const res = await fetch(`${BASE}/api/recipes/by-ingredients?${params}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Error ${res.status}`);
  }
  return res.json();
}