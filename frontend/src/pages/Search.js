import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '../hooks/useDebounce';
import RecipeCard from '../components/RecipeCard';
import { searchRecipes } from '../api';
import './Search.css';

const CATEGORIES = ['Beef','Chicken','Dessert','Lamb','Miscellaneous','Pasta','Pork','Seafood','Side','Starter','Vegan','Vegetarian','Breakfast','Goat'];
const CUISINES   = ['Afghan','Albanian','Algerian','American','British','Chinese','French','Greek','Indian','Italian','Japanese','Korean','Lebanese','Mexican','Moroccan','Spanish','Thai','Turkish'];
const SUGGESTIONS = ['Chicken','Pasta','Tacos','Curry','Salmon','Steak','Soup'];

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [query,         setQuery]         = useState(searchParams.get('q') || '');
  const [activeCat,     setActiveCat]     = useState('');
  const [activeCuisine, setActiveCuisine] = useState('');
  const [tab,           setTab]           = useState('name');

  const debouncedQuery   = useDebounce(query, 500);
  const debouncedCat     = useDebounce(activeCat, 500);
  const debouncedCuisine = useDebounce(activeCuisine, 500);

  const hasQuery = !!(debouncedQuery || debouncedCat || debouncedCuisine);

  const {
    data: recipes = [],
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['recipes', debouncedQuery, debouncedCat, debouncedCuisine],
    queryFn: () =>
      searchRecipes({
        query:   debouncedQuery || debouncedCat || debouncedCuisine,
        type:    debouncedCat     ? debouncedCat.toLowerCase()     : '',
        cuisine: debouncedCuisine ? debouncedCuisine.toLowerCase() : '',
      }),
    enabled: hasQuery,
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
    retry: 1, // only retry once before showing error — don't hammer a dead API
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleCat     = (cat) => setActiveCat(prev => prev === cat ? '' : cat);
  const handleCuisine = (cui) => setActiveCuisine(prev => prev === cui ? '' : cui);

  // Detect if API is completely down vs just no results
  const isApiDown = isError && (
    error?.message?.includes('500') ||
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('NetworkError')
  );

  const searched = hasQuery;

  return (
    <main className="search-page">
      <div className="search-page__header">
        <p className="eyebrow">Discover</p>
        <h1 className="search-page__title">Search the pantry.</h1>
      </div>

      <div className="search-page__layout">
        <aside className="search-page__sidebar">
          <div className="sidebar__search-type">
            <button className={`sidebar__tab${tab==='name'?' active':''}`} onClick={()=>setTab('name')}>Name</button>
            <button className={`sidebar__tab${tab==='ingredient'?' active':''}`} onClick={()=>setTab('ingredient')}>Ingredient</button>
          </div>
          <div className="sidebar__group">
            <p className="sidebar__group-label eyebrow">Categories</p>
            <div className="sidebar__chips">
              {CATEGORIES.map(c => (
                <button key={c} className={`sidebar__chip${activeCat===c?' active':''}`} onClick={()=>handleCat(c)}>{c}</button>
              ))}
            </div>
          </div>
          <div className="sidebar__group">
            <p className="sidebar__group-label eyebrow">Cuisines</p>
            <div className="sidebar__chips">
              {CUISINES.map(c => (
                <button key={c} className={`sidebar__chip${activeCuisine===c?' active':''}`} onClick={()=>handleCuisine(c)}>{c}</button>
              ))}
            </div>
          </div>
        </aside>

        <div className="search-page__main">
          <form className="search-page__form" onSubmit={handleSubmit} role="search">
            <div className="search-page__field">
              <label htmlFor="recipe-search" className="search-page__field-label eyebrow">
                Recipe Name
              </label>
              <input
                id="recipe-search"
                className="search-page__input"
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="paella, ramen, brownie…"
                autoFocus
                aria-label="Search for recipes"
              />
            </div>
            <button type="submit" className="search-page__btn" aria-label="Submit search">
              {isFetching ? 'Searching…' : 'Search'}
            </button>
          </form>

          {/* ── Loading skeletons ── */}
          {isLoading && (
            <div className="search-page__grid" aria-busy="true" aria-label="Loading recipes">
              {[...Array(6)].map((_,i) => (
                <div key={i} className="search-page__skeleton" style={{animationDelay:`${i*0.07}s`}}/>
              ))}
            </div>
          )}

          {/* ── API offline error ── */}
          {!isLoading && isError && (
            <div className="search-page__state search-page__state--error" role="alert">
              <p className="search-page__state-icon">{isApiDown ? '🔌' : '⚠️'}</p>
              <p className="search-page__state-title">
                {isApiDown
                  ? 'Our recipe service is temporarily unavailable'
                  : 'Something went wrong'}
              </p>
              <p className="search-page__state-text">
                {isApiDown
                  ? 'The recipe API appears to be offline. Please try again in a few minutes.'
                  : error.message}
              </p>
              {isApiDown && (
                <button
                  className="search-page__retry-btn"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              )}
            </div>
          )}

          {/* ── No results ── */}
          {!isLoading && !isError && searched && recipes.length === 0 && (
            <div className="search-page__state" role="status">
              <p className="search-page__state-icon">🍽️</p>
              <p className="search-page__state-title">
                No recipes found{debouncedQuery ? ` for "${debouncedQuery}"` : ''}.
              </p>
              <p className="search-page__state-text">
                Double-check your spelling, or try one of these:
              </p>
              <div className="search-page__suggestions">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    className="search-page__suggestion-chip"
                    onClick={() => { setQuery(s); navigate(`/search?q=${s}`); }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Results ── */}
          {!isLoading && !isError && recipes.length > 0 && (
            <div className="search-page__grid">
              {recipes.map((r, i) => (
                <RecipeCard key={r.id} recipe={r} style={{ animationDelay: `${i * 0.05}s` }} />
              ))}
            </div>
          )}

          {/* ── Initial empty state ── */}
          {!isLoading && !searched && (
            <div className="search-page__empty">
              <p className="search-page__state-icon">🔍</p>
              <p>Start searching to discover recipes.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}