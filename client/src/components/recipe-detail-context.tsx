import { createContext, useContext, useState, useCallback } from "react";
import type { Recipe } from "@shared/schema";
import RecipeDetailSheet from "@/components/recipe-detail-sheet";

interface RecipeDetailContextType {
  openRecipe: (recipe: Recipe) => void;
  closeRecipe: () => void;
}

const RecipeDetailContext = createContext<RecipeDetailContextType | null>(null);

export function useRecipeDetail() {
  const ctx = useContext(RecipeDetailContext);
  if (!ctx) throw new Error("useRecipeDetail must be used within RecipeDetailProvider");
  return ctx;
}

export function RecipeDetailProvider({ children }: { children: React.ReactNode }) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [open, setOpen] = useState(false);

  const openRecipe = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setOpen(true);
  }, []);

  const closeRecipe = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <RecipeDetailContext.Provider value={{ openRecipe, closeRecipe }}>
      {children}
      <RecipeDetailSheet
        recipe={selectedRecipe}
        open={open}
        onOpenChange={setOpen}
      />
    </RecipeDetailContext.Provider>
  );
}
