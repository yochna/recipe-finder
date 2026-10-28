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
import FridgeScan from './pages/FridgeScan';
import Favorites from './pages/Favorites';
import CookMode from './pages/CookMode';
import RecipeDetail from './pages/RecipeDetail';
import ResetPassword from './pages/ResetPassword';
import ShoppingList from './pages/ShoppingList';
import AdminDashboard from './pages/AdminDashboard';
import AdminRoute from './components/AdminRoute';

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
                    <Route path="/fridge-scan"    element={<FridgeScan />} />
                    <Route path="/recipe/:id"     element={<RecipeDetail />} />
                    <Route path="/favorites"      element={<Favorites />} />
                    <Route path="/shopping-list"  element={<ShoppingList />} />
                    <Route path="/admin"          element={<AdminRoute><AdminDashboard /></AdminRoute>} />
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