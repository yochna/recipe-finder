# 🍳 Saffron & Stove — Recipe Finder

A full-stack recipe discovery app built with the MERN stack, featuring AI-powered recipe suggestions, cook mode with timers, and a shopping list exporter.

## 🌐 Live Demo
- Frontend: [recipe-finder-cyan-eight.vercel.app](https://recipe-finder-cyan-eight.vercel.app)

## ✨ Features

- 🔍 **Recipe Search** — Search by ingredient, cuisine, diet, or dish type via Spoonacular API
- 🤖 **AI Chef (Chef Olive)** — Chat with an AI sous-chef powered by Groq (LLaMA 3.3 70B) for personalized recipe suggestions
- 👨‍🍳 **Cook Mode** — Full-screen step-by-step cooking view with built-in countdown timers per step
- ❤️ **Favorites** — Save and manage your favourite recipes (per-user, stored in MongoDB)
- 🛒 **Shopping List** — Add recipes to a shopping list, check off ingredients, copy or print/export as PDF
- 🔐 **Authentication** — JWT-based auth with httpOnly secure cookies, register/login/logout
- 📧 **Forgot Password** — Email-based password reset via Gmail SMTP (Nodemailer)
- 🖼️ **Image Proxy** — Backend proxy for Spoonacular images to avoid CORS issues

## 🛠️ Tech Stack

### Frontend
- React 18
- React Router v6
- Context API (Auth, Favorites, Shopping List)
- CSS Modules (custom design system)

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT + httpOnly Cookies
- Nodemailer (Gmail SMTP)
- Spoonacular API
- Groq API (LLaMA 3.3 70B)

## 📁 Project Structure
recipe-finder/
├── backend/
│   ├── server.js          # Express server, all API routes
│   ├── .env               # Environment variables (not committed)
│   └── package.json
└── frontend/
├── src/
│   ├── components/    # Navbar, RecipeCard, AuthModal
│   ├── context/       # AuthContext, FavoritesContext, ShoppingListContext
│   ├── pages/         # Home, Search, AiChef, Favorites, CookMode, ShoppingList, ResetPassword
│   └── api.js         # Frontend API helpers
└── package.json

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Spoonacular API key
- Groq API key
- Gmail account with App Password

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
SPOONACULAR_KEY=your_spoonacular_api_key
GROQ_KEY=your_groq_api_key
JWT_SECRET=your_jwt_secret
GMAIL_USER=your_gmail@gmail.com
GMAIL_PASS=your_16char_app_password
```

```bash
node server.js
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

App runs at `http://localhost:3000`

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `SPOONACULAR_KEY` | [Spoonacular API](https://spoonacular.com/food-api) key |
| `GROQ_KEY` | [Groq API](https://groq.com) key |
| `JWT_SECRET` | Any random secret string |
| `GMAIL_USER` | Gmail address for sending emails |
| `GMAIL_PASS` | Gmail App Password (16 characters, no spaces) |

## 📸 Screenshots

> Home page, Search, AI Chef, Cook Mode, Favorites, Shopping List

## 👩‍💻 Developer

**B. Yochna Rao** — Full Stack Developer  
📧 raoyochna07@gmail.com  
🔗 [GitHub](https://github.com/yochna) · [LinkedIn](https://linkedin.com/in/b-yochna-rao-6ab964285)

## 📄 License
MIT