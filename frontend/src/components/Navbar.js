import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useShoppingList } from '../context/ShoppingListContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import './Navbar.css';

export default function Navbar() {
  const { favorites } = useFavorites();
  const { items } = useShoppingList();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [modal, setModal] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <>
      <header className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <Link to="/" className="navbar__brand">
          <span className="navbar__brand-serif">Saffron</span>
          <span className="navbar__brand-script">&amp; Stove</span>
        </Link>

        <nav className="navbar__nav">
          <NavLink to="/" className={({isActive}) => `navbar__link${isActive ? ' active' : ''}`}>Home</NavLink>
          <NavLink to="/search" className={({isActive}) => `navbar__link${isActive ? ' active' : ''}`}>
            <i className="fas fa-search navbar__link-icon"/>Search
          </NavLink>
          <NavLink to="/ai-chef" className={({isActive}) => `navbar__link navbar__link--ai${isActive ? ' active' : ''}`}>
            <i className="fas fa-hat-chef navbar__link-icon"/>AI Chef
          </NavLink>
          <NavLink to="/favorites" className={({isActive}) => `navbar__link${isActive ? ' active' : ''}`}>
            <i className="far fa-heart navbar__link-icon"/>Favorites
            {favorites.size > 0 && <span className="navbar__fav-count">{favorites.size}</span>}
          </NavLink>
          <NavLink to="/shopping-list" className={({isActive}) => `navbar__link${isActive ? ' active' : ''}`}>
            <i className="fas fa-shopping-basket navbar__link-icon"/>List
            {items.length > 0 && <span className="navbar__fav-count">{items.length}</span>}
          </NavLink>
        </nav>

        <div className="navbar__actions">
          {user ? (
            <div className="navbar__user" ref={dropdownRef}>
              <button
                className="navbar__user-btn"
                onClick={() => setDropdownOpen(prev => !prev)}
              >
                <span className="navbar__user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="navbar__user-name">{user.name.split(' ')[0]}</span>
                <i className="fas fa-chevron-down navbar__user-chevron"/>
              </button>
              {dropdownOpen && (
                <div className="navbar__dropdown">
                  <p className="navbar__dropdown-email">{user.email}</p>
                  <button
                    className="navbar__dropdown-logout"
                    onClick={() => { logout(); setDropdownOpen(false); }}
                  >
                    <i className="fas fa-sign-out-alt"/> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button className="navbar__btn navbar__btn--ghost" onClick={() => setModal('login')}>Sign In</button>
              <button className="navbar__btn navbar__btn--solid" onClick={() => setModal('register')}>Join</button>
            </>
          )}
        </div>
      </header>

      {modal && <AuthModal mode={modal} onClose={() => setModal(null)} />}
    </>
  );
}