import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useShoppingList } from '../context/ShoppingListContext';
import { useAuth } from '../context/AuthContext';
import './RecipeCard.css';

const FALLBACK = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&h=400&q=80';

const proxyImage = (url) => {
  if (!url) return FALLBACK;
  return url;
};

export default function RecipeCard({ recipe, variant = 'grid', style, onLoginRequired }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addRecipe, isInList } = useShoppingList();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [imgErr, setImgErr] = useState(false);
  const [pop, setPop] = useState(false);
  const [added, setAdded] = useState(false);
  const faved = isFavorite(recipe.id ?? recipe.recipeId);
  const inList = isInList(recipe.id ?? recipe.recipeId);

  const cuisine = recipe.cuisines?.[0] || '';
  const dishType = recipe.dishTypes?.[0] || '';
  const tag = [cuisine, dishType].filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' · ');

  const onHeart = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { if (onLoginRequired) onLoginRequired(); return; }
    setPop(true); setTimeout(() => setPop(false), 400);
    await toggleFavorite({ ...recipe, id: recipe.id ?? recipe.recipeId });
  };

  const onCook = () => navigate(`/cook/${recipe.id ?? recipe.recipeId}`);

  const onShoppingList = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (inList || added) return;
    await addRecipe(recipe);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const cardBody = (
    <div className="rcard__body">
      {tag && <p className="rcard__tag eyebrow">{tag}</p>}
      <h3 className={`rcard__title${variant === 'featured' ? ' rcard__title--lg' : ''}`}>{recipe.title}</h3>
      <div className="rcard__meta">
        {recipe.readyInMinutes && <span><i className="fas fa-clock"/> {recipe.readyInMinutes} min</span>}
        {recipe.servings && <span><i className="fas fa-users"/> {recipe.servings}{variant === 'featured' ? ' servings' : ''}</span>}
      </div>
      <a href={recipe.sourceUrl || '#'} target="_blank" rel="noopener noreferrer" className="rcard__link">
        View recipe <i className="fas fa-arrow-right"/>
      </a>
      <div className="rcard__actions">
        <button className="rcard__cook-btn" onClick={onCook}>
          <i className="fas fa-hat-chef"/> Cook Mode
        </button>
        <button
          className={`rcard__shop-btn${inList || added ? ' added' : ''}`}
          onClick={onShoppingList}
          disabled={inList || added}
        >
          <i className={`fas fa-${inList || added ? 'check' : 'shopping-basket'}`}/>
          {inList || added ? ' Added' : ' Shopping List'}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`rcard${variant === 'featured' ? ' rcard--featured' : ''}`} style={style}>
      <div className="rcard__img-wrap">
        <img
          src={imgErr ? FALLBACK : proxyImage(recipe.image)}
          alt={recipe.title}
          onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK; setImgErr(true); }}
          loading="lazy"
        />
        <button
          className={`rcard__heart${faved ? ' active' : ''}${pop ? ' pop' : ''}`}
          onClick={onHeart}
          aria-label="Toggle favorite"
        >
          <i className={faved ? 'fas fa-heart' : 'far fa-heart'} />
        </button>
      </div>
      {cardBody}
    </div>
  );
}