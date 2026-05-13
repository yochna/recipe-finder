import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import RecipeCard from '../components/RecipeCard';
import AuthModal from '../components/AuthModal';
import './Favorites.css';

export default function Favorites() {
  const { user } = useAuth();
  const { favorites, loading } = useFavorites();
  const [showModal, setShowModal] = useState(false);
  const items = Array.from(favorites.values());

  if (!user) {
    return (
      <main className="favs">
        <div className="favs__header">
          <p className="eyebrow">Your Collection</p>
          <h1 className="favs__title">Favorites</h1>
          <p className="favs__sub">Sign in to view and manage your saved recipes.</p>
        </div>
        <div className="favs__body">
          <div className="favs__empty">
            <p className="eyebrow favs__empty-eyebrow">Sign In Required</p>
            <h2 className="favs__empty-title">You need an account to save recipes.</h2>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.25rem' }}>
              <button className="navbar__btn navbar__btn--ghost" onClick={() => setShowModal('login')}>Sign In</button>
              <button className="navbar__btn navbar__btn--solid" onClick={() => setShowModal('register')}>Create Account</button>
            </div>
          </div>
        </div>
        {showModal && <AuthModal mode={showModal} onClose={() => setShowModal(false)} />}
      </main>
    );
  }

  return (
    <main className="favs">
      <div className="favs__header">
        <p className="eyebrow">Your Collection</p>
        <h1 className="favs__title">Favorites</h1>
        <p className="favs__sub">Recipes you've bookmarked for later — the curated personal cookbook.</p>
      </div>
      <div className="favs__body">
        {loading && <div className="favs__loading"><div className="favs__spinner" /></div>}
        {!loading && items.length === 0 && (
          <div className="favs__empty">
            <p className="eyebrow favs__empty-eyebrow">Empty Plate</p>
            <h2 className="favs__empty-title">No favorites yet — start browsing.</h2>
            <Link to="/search" className="favs__empty-cta">Find Recipes</Link>
          </div>
        )}
        {!loading && items.length > 0 && (
          <div className="favs__grid">
            {items.map((r, i) => (
              <RecipeCard
                key={r.recipeId}
                recipe={{ ...r, id: r.recipeId }}
                style={{ animationDelay: `${i * 0.06}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}