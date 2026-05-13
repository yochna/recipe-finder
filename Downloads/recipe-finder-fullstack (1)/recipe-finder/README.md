# 🧭 Culinary Compass

A full-stack recipe finder app built with **React**, **Tailwind-inspired CSS**, **Node.js**, **Express**, and **MongoDB**.

---

## Project Structure

```
recipe-finder/
├── backend/          ← Express + MongoDB API
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/         ← React app
    ├── public/
    └── src/
        ├── api.js
        ├── App.js
        ├── context/FavoritesContext.js
        ├── components/
        │   ├── Navbar.js / .css
        │   ├── RecipeCard.js / .css
        │   └── SearchBar.js / .css
        └── pages/
            ├── Home.js / .css
            └── Favorites.js / .css
```

---

## Getting Started

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your credentials in .env
npm run dev       # or: npm start
```

**Required `.env` values:**
| Key               | Description                              |
|-------------------|------------------------------------------|
| `PORT`            | Server port (default: 5000)              |
| `SPOONACULAR_KEY` | API key from spoonacular.com (free tier) |
| `MONGO_URI`       | MongoDB connection string (Atlas or local)|

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

The React app runs on `http://localhost:3000` and proxies `/api/*` to `http://localhost:5000`.

---

## API Endpoints

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/api/recipes`        | Search recipes (proxies Spoonacular) |
| GET    | `/api/favorites`      | Get all saved favorites              |
| POST   | `/api/favorites`      | Save a recipe                        |
| DELETE | `/api/favorites/:id`  | Remove a saved recipe                |

### Query params for `/api/recipes`
- `query` (required) — search term
- `cuisine` — e.g. italian, mexican
- `diet` — e.g. vegetarian, vegan, keto
- `type` — e.g. main course, dessert, soup
- `number` — results count (max 20)

---

## Features
- 🔍 Live recipe search with cuisine / diet / meal filters
- ❤️ Save & remove favorites (stored in MongoDB)
- 🌙 Dark editorial design with smooth animations
- 📱 Responsive for mobile & desktop
- ⚡ Debounced search, loading skeletons, error states
