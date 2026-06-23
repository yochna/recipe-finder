import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import RecipeCard from '../components/RecipeCard';
import { searchRecipes } from '../api';
import './Home.css';

const TICKER_ITEMS = ['Italian','Mexican','Indian','French','Thai','Moroccan','Japanese','Greek','Spanish','Lebanese','Korean','Vietnamese','Turkish','Ethiopian'];

const CATEGORIES = [
  { name: 'Beef',       img: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=400&h=320&q=80' },
  { name: 'Chicken',    img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=400&h=320&q=80' },
  { name: 'Dessert',    img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&h=320&q=80' },
  { name: 'Lamb',       img: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=400&h=320&q=80' },
  { name: 'Pasta',      img: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=400&h=320&q=80' },
  { name: 'Seafood',    img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=320&q=80' },
  { name: 'Vegetarian', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&h=320&q=80' },
  { name: 'Breakfast',  img: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=400&h=320&q=80' },
];


const FEATURED_TERMS = ['paella', 'pasta', 'curry', 'steak', 'sushi', 'tacos'];
const randomTerm = FEATURED_TERMS[Math.floor(Math.random() * FEATURED_TERMS.length)];

export default function Home() {
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState('');


  const { data: featured = [], isLoading: loadingFeatured } = useQuery({
    queryKey: ['featured', randomTerm],
    queryFn: () => searchRecipes({ query: randomTerm, number: 3 }),
    staleTime: 1000 * 60 * 5, 
  });

  const handleHeroSubmit = (e) => {
    e.preventDefault();
    if (!heroQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(heroQuery.trim())}`);
  };

  const handleCategory = (cat) => {
    navigate(`/search?q=${encodeURIComponent(cat.toLowerCase())}`);
  };

  return (
    <main className="home">

      {/* ── Hero ── */}
      <section className="home__hero">
        <div className="home__hero-left">
          <p className="eyebrow home__hero-eyebrow">Issue N° 01 · Winter Plate</p>
          <h1 className="home__hero-headline">
            The recipe you<br/>
            <em>almost</em> remembered
          </h1>
          <p className="home__hero-sub">— now found.</p>
          <p className="home__hero-desc">
            Type an ingredient sitting in your fridge, a country you miss,<br/>
            or a craving you can't shake. We'll plate the rest.
          </p>
          <form className="home__hero-form" onSubmit={handleHeroSubmit}>
            <input
              className="home__hero-input"
              type="text"
              value={heroQuery}
              onChange={e => setHeroQuery(e.target.value)}
              placeholder="e.g. chicken, dumpling, paprika…"
            />
            <button type="submit" className="home__hero-btn">Find Recipes</button>
          </form>
        </div>
        <div className="home__hero-right">
          <img
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&h=700&q=85"
            alt="Beautiful plated dish"
            className="home__hero-photo"
          />
          <p className="home__hero-photo-caption">Photographed in afternoon light · No filters</p>
        </div>
      </section>

      {/* ── Cuisine Ticker ── */}
      <div className="home__ticker-wrap" aria-hidden="true">
        <div className="home__ticker">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((c, i) => (
            <span key={i} className="home__ticker-item">
              {c} <span className="home__ticker-dot">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Browse by category ── */}
      <section className="home__section">
        <div className="home__section-header">
          <div>
            <p className="eyebrow">Browse</p>
            <h2 className="home__section-title">By the kind of hungry you are.</h2>
          </div>
          <Link to="/search" className="home__see-all">See All</Link>
        </div>
        <div className="home__categories">
          {CATEGORIES.map(cat => (
            <button key={cat.name} className="home__cat-card" onClick={() => handleCategory(cat.name)}>
              <div className="home__cat-img-wrap">
                <img src={cat.img} alt={cat.name} loading="lazy" />
              </div>
              <p className="eyebrow home__cat-label">Category</p>
              <h3 className="home__cat-name">{cat.name}</h3>
            </button>
          ))}
        </div>
      </section>

      {/* ── AI Chef banner ── */}
      <section className="home__ai-banner">
        <div className="home__ai-banner-inner">
          <p className="eyebrow home__ai-eyebrow">AI Sous-Chef</p>
          <h2 className="home__ai-title">Open the fridge.<br/>We'll write the menu.</h2>
          <Link to="/ai-chef" className="home__ai-cta">Talk to Chef Olive</Link>
        </div>
        <p className="home__ai-quote">"Two eggs,<br/>some spinach,<br/>that's a meal."</p>
      </section>

      {/* ── Tonight's tasting menu ── */}
      <section className="home__section">
        <div className="home__section-header">
          <div>
            <p className="eyebrow">From the Kitchen</p>
            <h2 className="home__section-title">Tonight's tasting menu.</h2>
          </div>
          <span className="home__tasting-sub">— a fresh handful, every visit.</span>
        </div>

        {loadingFeatured ? (
          <div className="home__featured-grid">
            {[...Array(3)].map((_,i) => <div key={i} className="home__skeleton" style={{animationDelay:`${i*0.1}s`}}/>)}
          </div>
        ) : (
          <div className="home__featured-grid">
            {featured.map((r, i) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                variant={i === 0 ? 'featured' : 'grid'}
                style={{ animationDelay: `${i * 0.08}s` }}
              />
            ))}
          </div>
        )}
      </section>

    </main>
  );
}