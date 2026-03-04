const BASE_URL = "https://recipe-finder-production-c144.up.railway.app/recipeProxy";
const FAV_URL = "https://recipe-finder-production-c144.up.railway.app/favorites";

const searchBtn = document.getElementById("search-btn");
const searchInput = document.getElementById("search-input");
const cuisineFilter = document.getElementById("cuisine");
const dietFilter = document.getElementById("diet");
const mealTypeFilter = document.getElementById("meal-type");
const recipesContainer = document.getElementById("recipes-container");
const loadingElement = document.getElementById("loading");
const errorElement = document.getElementById("error-message");
const fab = document.querySelector(".fab");

let favorites = new Set();

// ---------- Utility Functions ----------
function showLoading(query) {
    loadingElement.style.display = "flex";
    loadingElement.innerHTML = `
        <div class="spinner"></div>
        <p>Searching for "${query}"...</p>
    `;
}

function hideLoading() {
    loadingElement.style.display = "none";
}

function showError(message) {
    errorElement.textContent = message;
    recipesContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-circle"></i>
            <h3>Error loading recipes</h3>
            <p>${message}</p>
        </div>
    `;
}

async function loadFavorites() {
    try {
        const res = await fetch(FAV_URL);
        const data = await res.json();
        favorites = new Set(data.map(f => f.recipeId));
    } catch (err) {
        console.error("Could not load favorites:", err)
    }
}

// ---------- Fetch Recipes ----------
async function fetchRecipes(query) {
    showLoading(query);
    errorElement.textContent = "";
    recipesContainer.innerHTML = "";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const url = new URL(BASE_URL);
        url.searchParams.append("query", query);
        url.searchParams.append("number", "12");
        url.searchParams.append("addRecipeInformation", "true");
        if (cuisineFilter.value) url.searchParams.append("cuisine", cuisineFilter.value);
        if (dietFilter.value) url.searchParams.append("diet", dietFilter.value);
        if (mealTypeFilter.value) url.searchParams.append("type", mealTypeFilter.value);

        const res = await fetch(url.toString(), { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) {
            throw new Error(res.status === 402 ? "API quota exceeded." : "Failed to fetch recipes.");
        }

        const data = await res.json();
        return data.results || [];
    } catch (err) {
        if (err.name === "AbortError") throw new Error("Request timed out. Check your connection.");
        throw err;
    } finally {
        hideLoading();
    }
}

// ---------- Display Recipes ----------
function createRecipeCard(recipe) {
    const isFavorite = favorites.has(recipe.id);
    const badges = [];

    if (recipe.vegetarian) badges.push("Vegetarian");
    if (recipe.vegan) badges.push("Vegan");
    if (recipe.glutenFree) badges.push("Gluten-Free");

    return `
    <div class="recipe-card" data-id="${recipe.id}">
        <div class="recipe-img-container">
            <img src="${recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&h=300'}" 
                 alt="${recipe.title || 'Secret Recipe'}" class="recipe-img">
            ${badges.map(b => `<div class="recipe-badge">${b}</div>`).join('')}
            <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${recipe.id}">
                <i class="fas fa-heart"></i>
            </button>
        </div>
        <div class="recipe-info">
            <div class="card-header">
                <h3>${recipe.title || 'Secret Recipe'}</h3>
            </div>
            <div class="recipe-meta">
                <span class="meta-item"><i class="fas fa-clock"></i> ${recipe.readyInMinutes || 'Ready soon!'}</span>
                <span class="meta-item"><i class="fas fa-utensils"></i> ${recipe.servings || 'Serves many'}</span>
            </div>
            <a href="${recipe.sourceUrl || '#'}" target="_blank" class="view-recipe-btn">
                <i class="fas fa-book-open"></i> View Recipe
            </a>
        </div>
    </div>`;
}

function displayRecipes(recipes) {
    if (!recipes.length) {
        recipesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search-minus"></i>
                <h3>No Recipes Found</h3>
                <p>Try different search terms or adjust your filters</p>
            </div>
        `;
        return;
    }

    recipesContainer.innerHTML = recipes.map(createRecipeCard).join('');
}

async function toggleFavorite(recipeId, recipeData) {
    recipeId = Number(recipeId);

    try {
        if (favorites.has(recipeId)) {
            // Remove from MongoDB
            await fetch(`${FAV_URL}/${recipeId}`, { method: "DELETE" });
            favorites.delete(recipeId);
        } else {
            // Save to MongoDB
            await fetch(FAV_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipeId,
                    title: recipeData.title,
                    image: recipeData.image,
                    readyInMinutes: recipeData.readyInMinutes,
                    servings: recipeData.servings,
                    sourceUrl: recipeData.sourceUrl
                })
            });
            favorites.add(recipeId);
        }

        // Update button UI
        const btn = document.querySelector(`.favorite-btn[data-id="${recipeId}"]`);
        if (btn) {
            btn.classList.toggle("active");
            btn.classList.add("pulse-animation");
            setTimeout(() => btn.classList.remove("pulse-animation"), 500);
        }
    } catch (err) {
        console.error("Favorite error:", err);
    }
}
// ---------- Event Listeners ----------
searchBtn.addEventListener("click", async () => {
    const query = searchInput.value.trim();
    if (!query) return showError("Please enter a search term.");
    try {
        const recipes = await fetchRecipes(query);
        displayRecipes(recipes);
    } catch (err) {
        showError(err.message);
    }
});

searchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") searchBtn.click();
});

recipesContainer.addEventListener("click", e => {
    const favBtn = e.target.closest(".favorite-btn");
      if (!favBtn) return;

    // Get recipe data from the card
    const card = favBtn.closest(".recipe-card");
    const recipeData = {
        title: card.querySelector("h3").textContent,
        image: card.querySelector(".recipe-img").src,
        readyInMinutes: parseInt(card.querySelector(".fa-clock").parentElement.textContent) || null,
        servings: parseInt(card.querySelector(".fa-utensils").parentElement.textContent) || null,
        sourceUrl: card.querySelector(".view-recipe-btn").href
    };

    toggleFavorite(favBtn.dataset.id, recipeData);
});

fab.addEventListener("click", () => {
    searchInput.scrollIntoView({ behavior: "smooth" });
    searchInput.focus();
});

window.addEventListener("scroll", () => {
    fab.style.display = window.scrollY > 300 ? "flex" : "none";
});

loadFavorites().then(() => displayRecipes([]));
