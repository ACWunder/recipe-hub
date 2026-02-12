import { db } from "./db";
import { recipes } from "@shared/schema";
import { log } from "./index";

const seedRecipes = [
  {
    title: "Classic Pasta Carbonara",
    description: "A rich and creamy Italian classic made with just a few simple ingredients. The key is tempering the eggs with the hot pasta water.",
    imageUrl: "/images/carbonara.png",
    tags: ["Italian", "Pasta", "Quick"],
    ingredients: [
      "400g spaghetti",
      "200g pancetta or guanciale, diced",
      "4 large egg yolks",
      "100g Pecorino Romano, finely grated",
      "Freshly ground black pepper",
      "Salt for pasta water",
    ],
    steps: [
      "Bring a large pot of salted water to a boil and cook spaghetti until al dente",
      "While pasta cooks, fry pancetta in a large skillet over medium heat until crispy",
      "Whisk together egg yolks and grated Pecorino in a bowl",
      "Reserve 1 cup of pasta water, then drain the spaghetti",
      "Add hot pasta to the pancetta skillet, remove from heat",
      "Pour egg mixture over pasta, tossing quickly to create a creamy sauce",
      "Add pasta water a splash at a time if needed for consistency",
      "Serve immediately with extra Pecorino and black pepper",
    ],
    createdByUserId: "seed",
    isBase: true,
  },
  {"title":"Bolognese Sauce","description":"A slow-simmered Italian meat sauce made with minced beef, vegetables, wine, and tomatoes. The flavors develop through gentle cooking until rich and thick. Traditionally served with freshly cooked pasta and topped with grated parmesan.","imageUrl":"bolognese.jpg","tags":["italian","pasta"],"ingredients":["Butter","Olive oil","Basil","Onions","Carrot","Celery","Garlic","Minced meat","Red wine","Peeled tomatoes","Linguine","Parmesans"],"steps":["Brown the minced meat in a large pan over high heat until fully browned.","Add chopped onions, carrot, celery, and garlic to the pan.","Cook until the vegetables become soft.","Deglaze the pan with a splash of red wine.","Let the wine simmer until slightly reduced.","Add the peeled tomatoes to the pan.","Season with salt, pepper, and basil.","Simmer on low heat for 30–45 minutes until thick and rich.","Cook the linguine according to package instructions.","Mix the sauce with the cooked pasta before serving.","Sprinkle with grated parmesan before serving."]},
  {
    title: "Hawaiian Poke Bowl",
    description: "A vibrant and healthy bowl packed with fresh flavors. This Hawaiian staple is perfect for a light yet satisfying meal.",
    imageUrl: "/images/poke-bowl.png",
    tags: ["Hawaiian", "Healthy", "Seafood"],
    ingredients: [
      "300g sushi-grade ahi tuna, cubed",
      "2 cups cooked sushi rice",
      "1 ripe avocado, sliced",
      "1/2 cup shelled edamame",
      "1/4 cup soy sauce",
      "1 tsp sesame oil",
      "1 mango, diced",
      "Sesame seeds and scallions for garnish",
      "Pickled ginger (optional)",
    ],
    steps: [
      "Marinate tuna cubes in soy sauce and sesame oil for 15 minutes",
      "Cook sushi rice according to package directions and let cool slightly",
      "Divide rice between two bowls",
      "Arrange marinated tuna, avocado, edamame, and mango on top",
      "Sprinkle with sesame seeds and sliced scallions",
      "Serve with pickled ginger on the side",
    ],
    createdByUserId: "seed",
    isBase: true,
  },
  {
    title: "Fluffy Blueberry Pancakes",
    description: "Golden, pillowy pancakes bursting with fresh blueberries. A perfect weekend breakfast that the whole family will love.",
    imageUrl: "/images/pancakes.png",
    tags: ["Breakfast", "Sweet", "Family"],
    ingredients: [
      "1 1/2 cups all-purpose flour",
      "3 1/2 tsp baking powder",
      "1 tbsp sugar",
      "1/4 tsp salt",
      "1 1/4 cups milk",
      "1 egg",
      "3 tbsp melted butter",
      "1 cup fresh blueberries",
      "Maple syrup for serving",
    ],
    steps: [
      "Whisk together flour, baking powder, sugar, and salt in a large bowl",
      "Make a well in the center and pour in milk, egg, and melted butter",
      "Mix until smooth but don't overmix - a few lumps are fine",
      "Gently fold in fresh blueberries",
      "Heat a lightly oiled griddle or pan over medium-high heat",
      "Pour about 1/4 cup batter per pancake onto the griddle",
      "Cook until bubbles form on the surface, then flip and cook until golden",
      "Stack pancakes and serve with butter and warm maple syrup",
    ],
    createdByUserId: "seed",
    isBase: true,
  },
];

export async function seedDatabase() {
  try {
    const existing = await db.select().from(recipes);
    if (existing.length > 0) {
      log("Database already has recipes, skipping seed");
      return;
    }

    for (const recipe of seedRecipes) {
      await db.insert(recipes).values(recipe);
    }
    log(`Seeded ${seedRecipes.length} recipes`);
  } catch (err) {
    log(`Seed error: ${err}`);
  }
}
