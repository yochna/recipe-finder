import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FavoritesProvider } from './context/FavoritesContext';
import { AuthProvider } from './context/AuthContext';
import { ShoppingListProvider } from './context/ShoppingListContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Search from './pages/Search';
import AiChef from './pages/AiChef';
import Favorites from './pages/Favorites';
import CookMode from './pages/CookMode';
import ResetPassword from './pages/ResetPassword';
import ShoppingList from './pages/ShoppingList';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <ShoppingListProvider>
            <Routes>
              <Route path="/cook/:id" element={<CookMode />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/*" element={
                <>
                  <Navbar />
                  <Routes>
                    <Route path="/"               element={<Home />} />
                    <Route path="/search"         element={<Search />} />
                    <Route path="/ai-chef"        element={<AiChef />} />
                    <Route path="/favorites"      element={<Favorites />} />
                    <Route path="/shopping-list"  element={<ShoppingList />} />
                  </Routes>
                  <Footer />
                </>
              } />
            </Routes>
          </ShoppingListProvider>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}