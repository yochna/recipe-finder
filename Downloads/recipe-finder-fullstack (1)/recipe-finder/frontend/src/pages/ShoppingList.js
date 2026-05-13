import React from 'react';
import { Link } from 'react-router-dom';
import { useShoppingList } from '../context/ShoppingListContext';
import './ShoppingList.css';

export default function ShoppingList() {
  const { items, removeRecipe, clearList } = useShoppingList();

  const allIngredients = items.flatMap(item =>
    (item.ingredients || []).map(ing => ({
      ...ing,
      recipeTitle: item.title,
    }))
  );

  const handleCopy = () => {
    const text = items.map(item => {
      const ings = (item.ingredients || [])
        .map(i => `  - ${i.name} (${i.amount?.metric?.value} ${i.amount?.metric?.unit})`)
        .join('\n');
      return `${item.title}:\n${ings}`;
    }).join('\n\n');
    navigator.clipboard.writeText(text);
    alert('Shopping list copied to clipboard!');
  };

  const handlePrint = () => window.print();

  if (items.length === 0) {
    return (
      <main className="shop">
        <div className="shop__header">
          <p className="eyebrow">Your Kitchen</p>
          <h1 className="shop__title">Shopping List</h1>
          <p className="shop__sub">Add recipes to build your shopping list.</p>
        </div>
        <div className="shop__empty">
          <p className="eyebrow shop__empty-eyebrow">Empty Basket</p>
          <h2 className="shop__empty-title">No ingredients yet.</h2>
          <Link to="/search" className="shop__empty-cta">Find Recipes</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="shop">
      <div className="shop__header">
        <div>
          <p className="eyebrow">Your Kitchen</p>
          <h1 className="shop__title">Shopping List</h1>
          <p className="shop__sub">{allIngredients.length} ingredients from {items.length} recipe{items.length > 1 ? 's' : ''}.</p>
        </div>
        <div className="shop__header-actions">
          <button className="shop__btn shop__btn--outline" onClick={handleCopy}>
            <i className="fas fa-copy"/> Copy
          </button>
          <button className="shop__btn shop__btn--outline" onClick={handlePrint}>
            <i className="fas fa-print"/> Print / PDF
          </button>
          <button className="shop__btn shop__btn--danger" onClick={clearList}>
            <i className="fas fa-trash"/> Clear All
          </button>
        </div>
      </div>

      <div className="shop__body">
        {items.map(item => (
          <div key={item.recipeId} className="shop__recipe-block">
            <div className="shop__recipe-header">
              <h2 className="shop__recipe-title">{item.title}</h2>
              <button className="shop__remove" onClick={() => removeRecipe(item.recipeId)}>
                <i className="fas fa-times"/> Remove
              </button>
            </div>
            <ul className="shop__ingredients">
              {(item.ingredients || []).map((ing, i) => (
                <li key={i} className="shop__ingredient">
                  <label className="shop__ingredient-label">
                    <input type="checkbox" className="shop__checkbox" />
                    <span className="shop__ingredient-name">{ing.name}</span>
                    <span className="shop__ingredient-amount">
                      {ing.amount?.metric?.value} {ing.amount?.metric?.unit}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}