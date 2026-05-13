import React, { createContext, useContext, useState, useEffect } from 'react';

const Ctx = createContext(null);

export function ShoppingListProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('shoppingList') || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(items));
  }, [items]);

  const addRecipe = async (recipe) => {
    const id = recipe.id ?? recipe.recipeId;
    if (items.find(i => i.recipeId === id)) return;
    try {
      const res = await fetch(`/api/recipes/${id}/ingredients`, { credentials: 'include' });
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

  const clearList = () => setItems([]);

  const isInList = (id) => items.some(i => i.recipeId === Number(id));

  return (
    <Ctx.Provider value={{ items, addRecipe, removeRecipe, clearList, isInList }}>
      {children}
    </Ctx.Provider>
  );
}

export const useShoppingList = () => useContext(Ctx);