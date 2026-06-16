import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { BACKEND_URL } from '../api';

const Ctx = createContext(null);

export function ShoppingListProvider({ children }) {
  const { user } = useAuth();

  const [items, setItems] = useState(() => {
    // Only load from localStorage if user is logged in
    try {
      return JSON.parse(localStorage.getItem('shoppingList') || '[]');
    } catch { return []; }
  });

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(items));
  }, [items]);

  // Clear list when user logs out
  useEffect(() => {
    if (!user) {
      setItems([]);
      localStorage.removeItem('shoppingList');
    }
  }, [user]);

  const addRecipe = async (recipe) => {
    if (!user) return; // guard: don't allow adding if not signed in
    const id = recipe.id ?? recipe.recipeId;
    if (items.find(i => i.recipeId === id)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/recipes/${id}/ingredients`, { credentials: 'include' });
      const ingredients = await res.json();
      setItems(prev => [...prev, {
        recipeId: id,
        title: recipe.title,
        image: recipe.image,
        ingredients,
      }]);
    } catch (err) {
      console.error('Failed to fetch ingredients:', err);
    }
  };

  const removeRecipe = (recipeId) => {
    setItems(prev => prev.filter(i => i.recipeId !== recipeId));
  };

  const clearList = () => {
    setItems([]);
    localStorage.removeItem('shoppingList');
  };

  const isInList = (id) => items.some(i => i.recipeId === Number(id));

  return (
    <Ctx.Provider value={{ items, addRecipe, removeRecipe, clearList, isInList }}>
      {children}
    </Ctx.Provider>
  );
}

export const useShoppingList = () => useContext(Ctx);