import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import RecipeCard from '../components/RecipeCard';
import { searchRecipes } from '../api';
import './Search.css';

const CATEGORIES = ['Beef','Chicken','Dessert','Lamb','Miscellaneous','Pasta','Pork','Seafood','Side','Starter','Vegan','Vegetarian','Breakfast','Goat'];
const CUISINES   = ['Afghan','Albanian','Algerian','American','British','Chinese','French','Greek','Indian','Italian','Japanese','Korean','Lebanese','Mexican','Moroccan','Spanish','Thai','Turkish'];

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [query,   setQuery]   = useState(searchParams.get('q') || '');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [searched, setSearched] = useState(false);
  const [tab, setTab] = useState('name'); // name | ingredient
  const [activeCat, setActiveCat] = useState('');
  const [activeCuisine, setActiveCuisine] = useState('');

  // Run search if URL has ?q=
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setQuery(q); runSearch(q, '', ''); }
  }, []);

  const runSearch = async (q, cat, cui) => {
    if (!q && !cat && !cui) return;
    setLoading(true); setError(''); setSearched(true);
    try {
      const results = await searchRecipes({
        query: q || cat || cui,
        type: cat ? cat.toLowerCase() : '',
        cuisine: cui ? cui.toLowerCase() : '',
      });
      setRecipes(results);
    } catch (err) { setError(err.message); setRecipes([]); }
    finally { setLoading(false); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(query)}`);
    runSearch(query, activeCat, activeCuisine);
  };

  const handleCat = (cat) => {
    const next = activeCat === cat ? '' : cat;
    setActiveCat(next);
    runSearch(query, next, activeCuisine);
  };

  const handleCuisine = (cui) => {
    const next = activeCuisine === cui ? '' : cui;
    setActiveCuisine(next);
    runSearch(query, activeCat, next);
  };

  return (
    <main className="search-page">
      {/* Header */}
      <div className="search-page__header">
        <p className="eyebrow">Discover</p>
        <h1 className="search-page__title">Search the pantry.</h1>
      </div>

      <div className="search-page__layout">
        {/* Sidebar */}
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

        {/* Main */}
        <div className="search-page__main">
          {/* Search bar */}
          <form className="search-page__form" onSubmit={handleSubmit}>
            <div className="search-page__field">
              <label className="search-page__field-label eyebrow">Recipe Name</label>
              <input
                className="search-page__input"
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="paella, ramen, brownie…"
                autoFocus
              />
            </div>
            <button type="submit" className="search-page__btn">Search</button>
          </form>

          {/* Results */}
          {loading && (
            <div className="search-page__grid">
              {[...Array(6)].map((_,i) => <div key={i} className="search-page__skeleton" style={{animationDelay:`${i*0.07}s`}}/>)}
            </div>
          )}

          {!loading && error && (
            <div className="search-page__state">
              <p className="search-page__state-title">Something went wrong</p>
              <p className="search-page__state-text">{error}</p>
            </div>
          )}

          {!loading && !error && searched && recipes.length === 0 && (
            <div className="search-page__state">
              <p className="search-page__state-title">No results found</p>
              <p className="search-page__state-text">Try a different search term or remove filters.</p>
            </div>
          )}

          {!loading && !error && recipes.length > 0 && (
            <div className="search-page__grid">
              {recipes.map((r, i) => (
                <RecipeCard key={r.id} recipe={r} style={{ animationDelay: `${i * 0.05}s` }} />
              ))}
            </div>
          )}

          {!loading && !searched && (
            <div className="search-page__empty">
              <p>Start searching to discover recipes.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
