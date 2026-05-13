import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFavorites, addFavorite, removeFavorite } from '../api';
import { useAuth } from './AuthContext';

const Ctx = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavorites(new Map());
      return;
    }
    setLoading(true);
    getFavorites()
      .then(data => setFavorites(new Map(data.map(f => [f.recipeId, f]))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const isFavorite = id => favorites.has(Number(id));

  const toggleFavorite = async (recipe) => {
    if (!user) return;
    const id = Number(recipe.recipeId ?? recipe.id);
    if (favorites.has(id)) {
      await removeFavorite(id);
      setFavorites(prev => { const n = new Map(prev); n.delete(id); return n; });
    } else {
      const doc = await addFavorite({
        recipeId: id, title: recipe.title, image: recipe.image,
        readyInMinutes: recipe.readyInMinutes, servings: recipe.servings,
        sourceUrl: recipe.sourceUrl, vegetarian: recipe.vegetarian,
        vegan: recipe.vegan, glutenFree: recipe.glutenFree,
        cuisines: recipe.cuisines, dishTypes: recipe.dishTypes,
      });
      setFavorites(prev => new Map(prev).set(id, doc));
    }
  };

  return (
    <Ctx.Provider value={{ favorites, isFavorite, toggleFavorite, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export const useFavorites = () => useContext(Ctx);