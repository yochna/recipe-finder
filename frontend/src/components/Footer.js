import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="footer__brand-serif">Saffron</span>
          <span className="footer__brand-script">&amp; Stove</span>
          <p className="footer__tagline">A quiet kitchen, a loud appetite.</p>
        </div>
        <div className="footer__links">
          <span className="footer__powered">Powered by Spoonacular · Made with Rosemary</span>
        </div>
      </div>
      <div className="footer__bar" />
    </footer>
  );
}
