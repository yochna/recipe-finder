import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRecipeDetails } from '../api';
import { useFavorites } from '../context/FavoritesContext';
import { useShoppingList } from '../context/ShoppingListContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import Reviews from '../components/Reviews';
import './RecipeDetail.css';

const FALLBACK = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&h=400&q=80';

const stripHtml = (html = '') =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const fmtAmount = (n) => {
  if (!Number.isFinite(n) || n === 0) return '';
  return Number(n.toFixed(2)).toString();
};

const NUTRITION_ROWS = ['Calories', 'Protein', 'Fat', 'Carbohydrates', 'Fiber', 'Sugar', 'Sodium'];

function nutrientOf(nutrients, name) {
  return nutrients.find(n => n.name.toLowerCase() === name.toLowerCase());
}

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addRecipe, isInList } = useShoppingList();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [servings, setServings] = useState(null);

  const { data: r, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['recipe-details', id],
    queryFn: () => getRecipeDetails(id),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => { setServings(null); }, [id]);
  const baseServings = r?.servings || 1;
  const shownServings = servings || baseServings;
  const scale = baseServings ? shownServings / baseServings : 1;

  if (isLoading) {
    return (
      <main className="rd">
        <div className="rd__skeleton" aria-hidden="true">
          <div className="rd__sk rd__sk--hero" />
          <div className="rd__sk rd__sk--line" style={{ width: '55%' }} />
          <div className="rd__sk rd__sk--line" style={{ width: '80%' }} />
          <div className="rd__sk rd__sk--line" style={{ width: '70%' }} />
          <div className="rd__sk rd__sk--block" />
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="rd">
        <div className="rd__error">
          <p className="eyebrow">Kitchen hiccup</p>
          <h1>We couldn't plate this one.</h1>
          <p className="rd__error-msg">{error?.message || 'Something went wrong loading this recipe.'}</p>
          <div className="rd__error-actions">
            <button className="rd__btn" onClick={() => refetch()}>Try again</button>
            <button className="rd__btn rd__btn--solid" onClick={() => navigate('/search')}>Back to search</button>
          </div>
        </div>
      </main>
    );
  }

  const tag = [r.cuisines?.[0], r.dishTypes?.[0]].filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' · ');
  const diets = (r.diets || []).slice(0, 4);
  const nutrients = r.nutrition?.nutrients || [];
  const steps = r.analyzedInstructions?.[0]?.steps || [];
  const favObj = {
    recipeId: r.id, id: r.id, title: r.title, image: r.image,
    readyInMinutes: r.readyInMinutes, servings: r.servings, sourceUrl: r.sourceUrl,
    vegetarian: r.vegetarian, vegan: r.vegan, glutenFree: r.glutenFree,
  };
  const faved = isFavorite(r.id);
  const inList = isInList(r.id);

  const onFav = async () => {
    if (!user) { setShowModal('login'); return; }
    await toggleFavorite(favObj);
  };

  const onAddList = () => { if (!inList) addRecipe(favObj); };

  return (
    <main className="rd">
      <button className="rd__back" onClick={() => navigate(-1)} aria-label="Go back">
        <i className="fas fa-arrow-left" aria-hidden="true" /> Back
      </button>

      <section className="rd__hero">
        <figure className="rd__media">
          <img src={r.image || FALLBACK} alt={r.title} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK; }} />
        </figure>
        <div className="rd__intro">
          {tag && <p className="eyebrow">{tag}</p>}
          <h1 className="rd__title">{r.title}</h1>
          <div className="rd__meta">
            {r.readyInMinutes && <span><i className="fas fa-clock" aria-hidden="true" /> {r.readyInMinutes} min</span>}
            {r.servings && <span><i className="fas fa-users" aria-hidden="true" /> {r.servings} servings</span>}
            {r.healthScore > 0 && <span><i className="fas fa-seedling" aria-hidden="true" /> health score {r.healthScore}</span>}
          </div>
          {diets.length > 0 && (
            <div className="rd__diets">
              {diets.map(d => <span key={d} className="rd__diet">{d}</span>)}
            </div>
          )}
          {r.summary && <p className="rd__summary">{stripHtml(r.summary)}</p>}
          <div className="rd__cta">
            <Link to={`/cook/${r.id}`} className="rd__btn rd__btn--solid">
              <i className="fas fa-hat-wizard" aria-hidden="true" /> Cook Mode
            </Link>
            <button className={`rd__btn${faved ? ' rd__btn--fav' : ''}`} onClick={onFav} aria-pressed={faved}>
              <i className={faved ? 'fas fa-heart' : 'far fa-heart'} aria-hidden="true" />
              {faved ? ' Saved' : ' Save'}
            </button>
            <button className={`rd__btn${inList ? ' added' : ''}`} onClick={onAddList} disabled={inList}>
              <i className={`fas ${inList ? 'fa-check' : 'fa-shopping-basket'}`} aria-hidden="true" />
              {inList ? ' In list' : ' Shopping list'}
            </button>
            {r.sourceUrl && (
              <a className="rd__btn rd__btn--ghost" href={r.sourceUrl} target="_blank" rel="noopener noreferrer">
                Original <i className="fas fa-arrow-up-right-from-square" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="rd__grid">
        <section className="rd__panel" aria-label="Ingredients">
          <div className="rd__panel-head">
            <h2><i className="fas fa-basket-shopping" aria-hidden="true" /> Ingredients</h2>
            <div className="rd__servings" aria-label="Adjust servings">
              <button onClick={() => setServings(Math.max(1, shownServings - 1))} aria-label="Fewer servings">−</button>
              <span>{shownServings} {shownServings === 1 ? 'serving' : 'servings'}</span>
              <button onClick={() => setServings(shownServings + 1)} aria-label="More servings">+</button>
            </div>
          </div>
          <ul className="rd__ings">
            {(r.extendedIngredients || []).map(ing => (
              <li key={ing.id} className="rd__ing">
                <span className="rd__ing-amt">
                  {fmtAmount((ing.amount || 0) * scale)} {ing.unit || ''}
                </span>
                <span className="rd__ing-name">
                  {ing.name}
                  {ing.meta?.length > 0 && (
                    <em className="rd__ing-meta"> — {ing.meta.join(', ')}</em>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {nutrients.length > 0 && (
          <section className="rd__panel" aria-label="Nutrition">
            <div className="rd__panel-head"><h2><i className="fas fa-chart-simple" aria-hidden="true" /> Nutrition</h2>
              <span className="rd__per">per serving</span>
            </div>
            <div className="rd__nutrition">
              {NUTRITION_ROWS.map(name => {
                const n = nutrientOf(nutrients, name);
                if (!n) return null;
                const pct = Math.min(Math.round(n.percentOfDailyNeeds || 0), 100);
                return (
                  <div key={name} className="rd__nut">
                    <div className="rd__nut-top">
                      <span>{name}</span>
                      <span className="rd__nut-amt">{fmtAmount(n.amount)}{n.unit ? ` ${n.unit}` : ''}</span>
                    </div>
                    <div className="rd__bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${name} ${pct}% daily value`}>
                      <div className="rd__bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {steps.length > 0 ? (
        <section className="rd__panel rd__steps" aria-label="Directions">
          <div className="rd__panel-head"><h2><i className="fas fa-list-ol" aria-hidden="true" /> Directions</h2></div>
          <ol className="rd__steps-list">
            {steps.map(s => (
              <li key={s.number}>
                <span className="rd__step-num">{s.number}</span>
                <div>
                  <p>{s.step}</p>
                  {s.ingredients?.length > 0 && (
                    <p className="rd__step-ings">
                      {s.ingredients.map(i => i.name).join(', ')}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <section className="rd__panel rd__steps" aria-label="Directions">
          <div className="rd__panel-head"><h2><i className="fas fa-list-ol" aria-hidden="true" /> Directions</h2></div>
          <p className="rd__nosteps">
            This recipe doesn't have structured step-by-step instructions.{" "}
            {r.sourceUrl && (
              <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">
                View the full method at the original source <i className="fas fa-arrow-up-right-from-square" aria-hidden="true" />
              </a>
            )}
          </p>
        </section>
      )}

      <Reviews recipeId={r.id} recipeTitle={r.title} user={user} onRequireAuth={() => setShowModal('login')} />

      {showModal && <AuthModal mode={showModal} onClose={() => setShowModal(false)} />}
    </main>
  );
}
