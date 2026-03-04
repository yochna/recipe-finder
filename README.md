# 🍽️ Culinary Compass — Recipe Finder App

A full-stack recipe finder app that lets users search recipes by ingredients, cuisine, and dietary needs. Features a Node.js proxy server to securely hide API keys, and MongoDB to save favorite recipes.

---

## 🚀 Features

- 🔍 Search recipes by keyword, cuisine, diet, and meal type
- ❤️ Save and remove favorite recipes (stored in MongoDB)
- 📄 Dedicated favorites page
- 🔒 API key secured via Node.js proxy server
- ⏱️ Request timeout handling with AbortController
- 📱 Fully responsive design
- ✨ Smooth animations and hover effects

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| API | Spoonacular Food API |
| Styling | Custom CSS, Font Awesome, Google Fonts |

---

## 📁 Project Structure

```
recipe-finder/
├── index.html         # Main search page
├── favorites.html     # Saved favorites page
├── style.css          # Global styles
├── script.js          # Frontend JavaScript
├── server.js          # Express proxy server
└── .env               # Environment variables (not committed)
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js installed
- MongoDB installed locally
- Spoonacular API key (free at [spoonacular.com](https://spoonacular.com/food-api))

### 1. Clone the repository
```bash
git clone https://github.com/yochna/recipe-finder.git
cd recipe-finder
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create `.env` file
Create a `.env` file in the root folder:
```env
SPOONACULAR_KEY="your_spoonacular_api_key_here"
MONGO_URI="mongodb://localhost:27017/recipefinder"
```

> ⚠️ Never commit your `.env` file. It is listed in `.gitignore` for security.

Get a free Spoonacular API key at [spoonacular.com/food-api/console](https://spoonacular.com/food-api/console)

### 4. Start the server
```bash
node server.js
```

You should see:
```
MongoDB connected
Server running on http://localhost:5000
```

### 5. Open the app
Open `index.html` using **VS Code Live Server** at `http://localhost:5500`

---

## 🖥️ Running the App

You need the backend server running before using the app:

| Step | Command | URL |
|------|---------|-----|
| Start server | `node server.js` | http://localhost:5000 |
| Open frontend | Live Server in VS Code | http://localhost:5500 |

> ⚠️ If port 5000 is busy:
> ```cmd
> netstat -ano | findstr :5000
> taskkill /PID <number> /F
> ```

---

## 🔐 Environment Variables

Create a `.env` file in the root folder with the following:

```env
SPOONACULAR_KEY="your_spoonacular_api_key_here"
MONGO_URI="mongodb://localhost:27017/recipefinder"
```

| Variable | Description |
|----------|-------------|
| `SPOONACULAR_KEY` | Your Spoonacular API key |
| `MONGO_URI` | MongoDB connection string |

> 🔒 The `.env` file is in `.gitignore` and will never be committed to GitHub.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/recipeProxy` | Proxy search request to Spoonacular API |
| GET | `/favorites` | Get all saved favorite recipes |
| POST | `/favorites` | Save a recipe to favorites |
| DELETE | `/favorites/:id` | Remove a recipe from favorites |

---

## 🔑 Why a Proxy Server?

Instead of calling the Spoonacular API directly from the browser (which would expose your API key), all requests go through a local Express server which securely attaches the API key from `.env` before forwarding to Spoonacular.

```
Browser → localhost:5000/recipeProxy → Spoonacular API → Browser
```

---

## 👨‍💻 Author

**Yochna**
- GitHub: [@yochna](https://github.com/yochna)
