import { useQuery } from "@tanstack/react-query";
import type { Recipe } from "@shared/schema";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRecipeDetail } from "@/components/recipe-detail-context";
import RecipePlaceholder from "@/components/recipe-placeholder";
import AddRecipeSheet from "@/components/add-recipe-sheet";
import { Plus, Search, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

export default function AllRecipesPage() {
  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showMine, setShowMine] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const { openRecipe } = useRecipeDetail();

  const allTags = Array.from(
    new Set((recipes || []).flatMap((r) => r.tags))
  ).sort();

  const filtered = (recipes || []).filter((r) => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedTag && !r.tags.includes(selectedTag)) return false;
    if (showMine && r.createdByUserId !== "demo") return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <header className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h1 className="font-serif text-2xl font-bold" data-testid="text-recipes-title">Recipes</h1>
          <Button onClick={() => setAddOpen(true)} data-testid="button-add-recipe">
            <Plus className="w-4 h-4 mr-1.5" />
            Add
          </Button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Button
            size="sm"
            variant={!showMine ? "default" : "outline"}
            onClick={() => setShowMine(false)}
            data-testid="button-filter-all"
          >
            All recipes
          </Button>
          <Button
            size="sm"
            variant={showMine ? "default" : "outline"}
            onClick={() => setShowMine(true)}
            data-testid="button-filter-mine"
          >
            My recipes
          </Button>
        </div>

        {allTags.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "secondary"}
                className="cursor-pointer flex-shrink-0 text-xs"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                data-testid={`tag-filter-${tag}`}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 items-center">
                <Skeleton className="w-16 h-16 rounded-md flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
              <BookOpen className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No recipes found</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {filtered.map((recipe, i) => (
                <motion.div
                  key={recipe.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <button
                    className="w-full flex gap-3 items-center p-3 rounded-md bg-card text-left hover-elevate transition-all"
                    onClick={() => openRecipe(recipe)}
                    data-testid={`recipe-item-${recipe.id}`}
                  >
                    <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                      {recipe.imageUrl ? (
                        <img
                          src={recipe.imageUrl}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <RecipePlaceholder title={recipe.title} className="w-full h-full text-base" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{recipe.title}</h3>
                      {recipe.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {recipe.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {recipe.ingredients.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {recipe.ingredients.slice(0, 2).join(", ")}
                        </p>
                      )}
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <AddRecipeSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
