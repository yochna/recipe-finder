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

export async function getRecipeDetails(id) {
  const res = await fetch(`${BASE}/api/recipes/${id}/details`, { credentials: 'include' });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Error ${res.status}`);
  }
  return res.json();
}

// ── Scan history ──

export async function saveScan(ingredients, recipeCount) {
  const res = await fetch(`${BASE}/api/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ingredients, recipeCount }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Error ${res.status}`);
  }
  return res.json();
}

export async function getScans({ days } = {}) {
  const params = new URLSearchParams();
  if (days) params.append('days', String(days));
  const qs = params.toString();
  const res = await fetch(`${BASE}/api/scans${qs ? `?${qs}` : ''}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load scan history');
  return res.json();
}

export async function deleteScan(id) {
  const res = await fetch(`${BASE}/api/scans/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete scan');
  return res.json();
}

// ── Reviews ──

export async function getRecipeReviews(id) {
  const res = await fetch(`${BASE}/api/reviews/recipe/${id}`);
  if (!res.ok) throw new Error('Failed to load reviews');
  return res.json(); // { reviews, count, avg }
}

export async function getMyReview(id) {
  const res = await fetch(`${BASE}/api/reviews/mine/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load your review');
  return res.json(); // review | null
}

export async function submitReview({ recipeId, recipeTitle, rating, comment }) {
  const res = await fetch(`${BASE}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ recipeId, recipeTitle, rating, comment }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Error ${res.status}`);
  }
  return res.json();
}