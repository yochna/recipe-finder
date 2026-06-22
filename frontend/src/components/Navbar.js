import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useShoppingList } from '../context/ShoppingListContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import './Navbar.css';

export default function Navbar() {
  const { favorites } = useFavorites();
  const { items } = useShoppingList();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled]       = useState(false);
  const [modal, setModal]             = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  useEffect(() => { setDrawerOpen(false); }, [location]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  return (
    <>
      <header className={`navbar${scrolled ? ' scrolled' : ''}`}>

        <Link to="/" className="navbar__brand">
          <span className="navbar__brand-serif">Saffron</span>
          <span className="navbar__brand-script">&amp; Stove</span>
        </Link>

        <nav className="navbar__nav">
          <NavLink to="/" end className={({isActive}) => `navbar__link${isActive ? ' active' : ''}`}>Home</NavLink>
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
              <button className="navbar__user-btn" onClick={() => setDropdownOpen(p => !p)}>
                <span className="navbar__user-avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="navbar__user-name">{user.name.split(' ')[0]}</span>
                <i className="fas fa-chevron-down navbar__user-chevron"/>
              </button>
              {dropdownOpen && (
                <div className="navbar__dropdown">
                  <p className="navbar__dropdown-email">{user.email}</p>
                  <button className="navbar__dropdown-logout"
                    onClick={() => { logout(); setDropdownOpen(false); }}>
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

        <button
          className="navbar__hamburger"
          onClick={() => setDrawerOpen(p => !p)}
          aria-label="Toggle menu"
        >
          <span style={{ transform: drawerOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }}/>
          <span style={{ opacity: drawerOpen ? 0 : 1 }}/>
          <span style={{ transform: drawerOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }}/>
        </button>

      </header>

      <div className={`navbar__drawer${drawerOpen ? ' open' : ''}`}>
        <nav className="navbar__drawer-nav">
          <NavLink to="/" end className={({isActive}) => `navbar__drawer-link${isActive ? ' active' : ''}`}>
            <i className="fas fa-home"/> Home
          </NavLink>
          <NavLink to="/search" className={({isActive}) => `navbar__drawer-link${isActive ? ' active' : ''}`}>
            <i className="fas fa-search"/> Search
          </NavLink>
          <NavLink to="/ai-chef" className={({isActive}) => `navbar__drawer-link${isActive ? ' active' : ''}`}>
            <i className="fas fa-hat-chef"/> AI Chef
          </NavLink>
          <NavLink to="/favorites" className={({isActive}) => `navbar__drawer-link${isActive ? ' active' : ''}`}>
            <i className="far fa-heart"/> Favorites
            {favorites.size > 0 && <span className="navbar__fav-count" style={{marginLeft:8}}>{favorites.size}</span>}
          </NavLink>
          <NavLink to="/shopping-list" className={({isActive}) => `navbar__drawer-link${isActive ? ' active' : ''}`}>
            <i className="fas fa-shopping-basket"/> Shopping List
            {items.length > 0 && <span className="navbar__fav-count" style={{marginLeft:8}}>{items.length}</span>}
          </NavLink>
        </nav>

        <div className="navbar__drawer-auth">
          {user ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              <p style={{ fontSize:'13px', color:'var(--muted)', padding:'0 4px' }}>
                Signed in as <strong>{user.name}</strong>
              </p>
              <button className="navbar__drawer-btn" onClick={() => { logout(); setDrawerOpen(false); }}>
                <i className="fas fa-sign-out-alt"/> Sign Out
              </button>
            </div>
          ) : (
            <>
              <button className="navbar__drawer-btn" onClick={() => { setModal('login'); setDrawerOpen(false); }}>
                Sign In
              </button>
              <button className="navbar__drawer-btn navbar__drawer-btn--solid"
                onClick={() => { setModal('register'); setDrawerOpen(false); }}>
                Create Account
              </button>
            </>
          )}
        </div>
      </div>

      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.3)',
            zIndex:98, backdropFilter:'blur(2px)'
          }}
        />
      )}

      {modal && <AuthModal mode={modal} onClose={() => setModal(null)} />}
    </>
  );
}