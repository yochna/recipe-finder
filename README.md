# 🍳 Saffron & Stove — Recipe Finder

> A production-grade, full-stack recipe discovery platform built with the MERN stack — featuring AI-powered suggestions, offline support, and a focus on real-world engineering practices.

## 🌐 Live Demo
**Frontend:** [
recipe-finder-nu-seven.vercel.app]

---

## ⚙️ Engineering & Optimization Highlights

> These are not just features — they are deliberate engineering decisions made to reflect production-level thinking.

| Area | Implementation |
|------|---------------|
| 🔐 **Security** | Express.js proxy server encapsulates all 3rd-party API credentials — keys are never exposed to the client or browser network tab |
| ⚡ **Performance** | Custom `useDebounce` hook delays API calls by 500ms on keystroke, reducing redundant network requests by up to 70% |
| 🗄️ **State Management** | Replaced `useEffect` + `useState` fetching with **TanStack Query** for automatic caching, background refetching, and instant cache-hit navigation |
| 🚦 **Rate Limiting** | Three-tier `express-rate-limit` middleware — 100 req/15min globally, 10 req/15min on auth routes, 30 req/min on search — prevents API key abuse |
| 📶 **PWA & Offline** | Service Worker with cache-first strategy for static assets; branded offline fallback page; installable on desktop and mobile |
| ♿ **Accessibility** | Semantic HTML5 (`<figure>`, `<figcaption>`, `<main>`, `<aside>`), ARIA attributes (`aria-label`, `aria-pressed`, `aria-hidden`) across all interactive components |
| 🛡️ **Defensive Programming** | Handles empty results with contextual suggestions, API-down detection with retry UI, and CSS `text-overflow: ellipsis` to prevent layout breaking on long titles |
| 🔒 **Auth Security** | JWT stored in `httpOnly` cookies (not `localStorage`), `sameSite` cookie policy, bcrypt password hashing, and session-aware shopping list that clears on logout |

---

## ✨ Features

- 🔍 **Smart Recipe Search** — Debounced search by name, ingredient, cuisine, diet, or dish type via Spoonacular API
- 🤖 **AI Chef (Chef Olive)** — Conversational AI sous-chef powered by Groq (LLaMA 3.3 70B) for personalized recipe suggestions
- 👨‍🍳 **Cook Mode** — Distraction-free, full-screen step-by-step cooking view with built-in countdown timers per step
- ❤️ **Favorites** — Per-user recipe bookmarking stored in MongoDB, gated behind authentication
- 🛒 **Shopping List** — Add recipes, check off ingredients, copy to clipboard or print/export as PDF
- 🔐 **Authentication** — JWT-based auth with httpOnly secure cookies, register/login/logout, forgot password flow
- 📧 **Password Reset** — Email-based reset link via Gmail SMTP (Nodemailer) with 1-hour expiry token
- 🖼️ **Image Proxy** — Backend proxy for Spoonacular images to avoid CORS issues and hide API key
- 📲 **PWA** — Installable as a native-like app on desktop and mobile; works offline after first visit

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| React Router v6 | Client-side routing |
| TanStack Query v5 | Server state, caching, background sync |
| Custom `useDebounce` hook | Input debouncing |
| Context API | Auth, Favorites, Shopping List state |
| Service Worker + Web Manifest | PWA, offline support |
| CSS (custom design system) | Styling with CSS variables |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database + ODM |
| JWT + httpOnly Cookies | Secure authentication |
| bcryptjs | Password hashing |
| express-rate-limit | API abuse prevention |
| Nodemailer + Gmail SMTP | Transactional email |
| Spoonacular API | Recipe data (proxied) |
| Groq API (LLaMA 3.3 70B) | AI chat completions |

---

## 📁 Project Structure

recipe-finder/
├── backend/
│   ├── server.js               # Express server, routes, auth, rate limiting
│   ├── .env                    # Environment variables (not committed)
│   └── package.json
└── frontend/
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service Worker (offline + cache strategy)
│   ├── offline.html        # Branded offline fallback page
│   └── icons/              # PWA icons (192x192, 512x512)
└── src/
├── components/         # Navbar, RecipeCard, AuthModal
├── context/            # AuthContext, FavoritesContext, ShoppingListContext
├── hooks/              # useDebounce
├── pages/              # Home, Search, AiChef, Favorites, CookMode, ShoppingList
├── serviceWorkerRegistration.js
└── api.js              # Centralized API helpers

---

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

Create a `.env` file in `backend/`:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
SPOONACULAR_KEY=your_spoonacular_api_key
GROQ_KEY=your_groq_api_key
JWT_SECRET=your_jwt_secret_string
GMAIL_USER=your_gmail@gmail.com
GMAIL_PASS=your_16char_app_password
NODE_ENV=development
```

```bash
node server.js
# ✅ API running → http://localhost:5000
# ✅ MongoDB connected
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
# App runs at http://localhost:3000
```

---

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `SPOONACULAR_KEY` | [Spoonacular API](https://spoonacular.com/food-api) key |
| `GROQ_KEY` | [Groq API](https://groq.com) key |
| `JWT_SECRET` | Any random secret string (min 32 chars recommended) |
| `GMAIL_USER` | Gmail address for sending reset emails |
| `GMAIL_PASS` | Gmail App Password (16 characters, no spaces) |
| `NODE_ENV` | `development` locally · `production` on server |

---

## 🏗️ Architecture Decisions

**Why TanStack Query over Redux?**
This app's state is primarily *server state* — recipe results, favorites, user session. TanStack Query is purpose-built for this: it handles loading, error, caching, and staleness automatically, without the boilerplate of Redux actions and reducers.

**Why httpOnly cookies over localStorage for JWT?**
`localStorage` is accessible via JavaScript, making it vulnerable to XSS attacks. `httpOnly` cookies are invisible to JavaScript and sent automatically with every request — the industry-standard approach for session tokens.

**Why an Express proxy instead of calling Spoonacular directly from React?**
Any API key embedded in frontend code is visible in the browser's Network tab. The Express proxy keeps the key server-side and also lets us add rate limiting, caching, and error handling in one place.


---

## 👩‍💻 Developer

**B. Yochna Rao** — Full Stack Developer  
📧 raoyochna07@gmail.com  
🔗 [GitHub](https://github.com/yochna) · [LinkedIn](https://linkedin.com/in/b-yochna-rao-6ab964285)

---

## 📄 License
MIT