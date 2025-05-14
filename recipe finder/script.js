 const API_KEY = "INSERT_YOUR_KEY_HERE";
        if (API_KEY === "INSERT_YOUR_KEY_HERE") {
            alert("🔐 Get a FREE API key from spoonacular.com\n\n1. Sign up (free)\n2. Copy your key\n3. Paste it here");
            document.getElementById("search-btn").disabled = true;
        }
        const BASE_URL = "https://api.spoonacular.com/recipes/complexSearch";


        const searchBtn = document.getElementById("search-btn");
        const searchInput = document.getElementById("search-input");
        const cuisineFilter = document.getElementById("cuisine");
        const dietFilter = document.getElementById("diet");
        const mealTypeFilter = document.getElementById("meal-type");
        const recipesContainer = document.getElementById("recipes-container");
        const loadingElement = document.getElementById("loading");
        const errorElement = document.getElementById("error-message");
        const fab = document.querySelector(".fab");


        let favorites = JSON.parse(localStorage.getItem("favorites")) || [];


        async function fetchRecipes(query) {
            loadingElement.innerHTML = `
                <div class="spinner"></div>
                <p>Searching for "${query}"...</p>
            `;
            loadingElement.style.display = "flex";
            errorElement.textContent = "";
            recipesContainer.innerHTML = "";

            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 8000);

                const cuisine = cuisineFilter.value;
                const diet = dietFilter.value;
                const mealType = mealTypeFilter.value;

                const response = await fetch(
                    `${BASE_URL}?query=${query}&apiKey=${API_KEY}&number=12&addRecipeInformation=true${cuisine ? `&cuisine=${cuisine}` : ""}${diet ? `&diet=${diet}` : ""}${mealType ? `&type=${mealType}` : ""}`,
                    { signal: controller.signal }
                );
                clearTimeout(timeout);

                if (!response.ok) {
                    if (response.status === 402) {
                        throw new Error("API quota exceeded. Please try again later.");
                    }
                    throw new Error("Failed to fetch recipes. Please try again.");
                }

                const data = await response.json();
                return data.results || [];
            } catch (error) {
                if (error.name === "AbortError") {
                    throw new Error("Request timed out. Please check your connection and try again.");
                }
                throw error;
            } finally {
                loadingElement.style.display = "none";
            }
        }

        function displayRecipes(recipes) {
            if (!recipes || recipes.length === 0) {
                recipesContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search-minus"></i>
                        <h3>No Recipes Found</h3>
                        <p>Try different search terms or adjust your filters</p>
                    </div>
                `;
                return;
            }

            recipesContainer.innerHTML = recipes.map(recipe => {
                const isFavorite = favorites.includes(recipe.id);
                const title = recipe.title || "Secret Recipe";
                const image = recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=300&q=80";
                const readyTime = recipe.readyInMinutes ? `${recipe.readyInMinutes} mins` : "Ready soon!";
                const servings = recipe.servings ? `${recipe.servings} servings` : "Serves many";
                const sourceUrl = recipe.sourceUrl || "#";
                const isVegetarian = recipe.vegetarian || false;

                return `
                    <div class="recipe-card" data-id="${recipe.id}">
                        <div class="recipe-img-container">
                            <img src="${image}" alt="${title}" class="recipe-img">
                            ${isVegetarian ? '<div class="recipe-badge">Vegetarian</div>' : ''}
                            <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${recipe.id}">
                                <i class="fas fa-heart"></i>
                            </button>
                        </div>
                        <div class="recipe-info">
                            <div class="card-header">
                                <h3>${title}</h3>
                            </div>
                            <div class="recipe-meta">
                                <span class="meta-item"><i class="fas fa-clock"></i> ${readyTime}</span>
                                <span class="meta-item"><i class="fas fa-utensils"></i> ${servings}</span>
                            </div>
                            <a href="${sourceUrl}" target="_blank" class="view-recipe-btn">
                                <i class="fas fa-book-open"></i> View Recipe
                            </a>
                        </div>
                    </div>
                `;
            }).join("");
        }


        function toggleFavorite(recipeId) {
            const index = favorites.indexOf(recipeId);
            if (index === -1) {
                favorites.push(recipeId);
            } else {
                favorites.splice(index, 1);
            }
            localStorage.setItem("favorites", JSON.stringify(favorites));


            const favoriteBtn = document.querySelector(`.favorite-btn[data-id="${recipeId}"]`);
            if (favoriteBtn) {
                favoriteBtn.classList.toggle("active");

                favoriteBtn.style.animation = "pulse 0.5s";
                setTimeout(() => {
                    favoriteBtn.style.animation = "";
                }, 500);
            }
        }


        searchBtn.addEventListener("click", async () => {
            const query = searchInput.value.trim();
            if (!query) {
                errorElement.textContent = "Please enter a search term.";
                return;
            }
            try {
                const recipes = await fetchRecipes(query);
                displayRecipes(recipes);
            } catch (error) {
                errorElement.textContent = error.message;
                recipesContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>Error loading recipes</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        });

        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") searchBtn.click();
        });


        recipesContainer.addEventListener("click", (e) => {

            if (e.target.closest(".favorite-btn")) {
                const recipeId = e.target.closest(".favorite-btn").dataset.id;
                toggleFavorite(recipeId);
            }
        });


        fab.addEventListener("click", () => {
            searchInput.scrollIntoView({ behavior: 'smooth' });
            searchInput.focus();
        });


        window.addEventListener("scroll", () => {
            if (window.scrollY > 300) {
                fab.style.display = "flex";
            } else {
                fab.style.display = "none";
            }
        });


        displayRecipes([]);