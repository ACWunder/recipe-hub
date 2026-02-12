import { useQuery } from "@tanstack/react-query";
import type { RecipeWithAuthor } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRecipeDetail } from "@/components/recipe-detail-context";
import RecipePlaceholder from "@/components/recipe-placeholder";
import AddRecipeSheet from "@/components/add-recipe-sheet";
import { Plus, Search, BookOpen, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import AuthSheet from "@/components/auth-sheet";
import FollowingSheet from "@/components/friends-sheet";

type FilterScope = "all" | "mine" | "following" | "base";

export default function AllRecipesPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<FilterScope>("all");
  const [authOpen, setAuthOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  const { data: recipes, isLoading } = useQuery<RecipeWithAuthor[]>({
    queryKey: ["/api/recipes", `?scope=${scope}`],
  });

  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const { openRecipe } = useRecipeDetail();

  const allTags = Array.from(
    new Set((recipes || []).flatMap((r) => r.tags))
  ).sort();

  const filtered = (recipes || []).filter((r) => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedTag && !r.tags.includes(selectedTag)) return false;
    return true;
  });

  const handleScopeChange = (s: FilterScope) => {
    if ((s === "mine" || s === "following") && !user) {
      setAuthOpen(true);
      return;
    }
    setScope(s);
  };

  const handleAddRecipe = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setAddOpen(true);
  };

  const showAuthor = scope !== "mine";

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <h1 className="font-serif text-3xl font-bold tracking-tight" data-testid="text-recipes-title">Recipes</h1>
          <div className="flex items-center gap-2">
            {user && (
              <Button size="icon" variant="ghost" className="rounded-xl" onClick={() => setFollowingOpen(true)} data-testid="button-following">
                <Users className="w-5 h-5" />
              </Button>
            )}
            <Button onClick={handleAddRecipe} className="rounded-xl" data-testid="button-add-recipe">
              <Plus className="w-4 h-4 mr-1.5" />
              Add
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          {(["all", "mine", "following", "base"] as FilterScope[]).map((s) => (
            <button
              key={s}
              onClick={() => handleScopeChange(s)}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-all ${
                scope === s ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
              }`}
              data-testid={`filter-recipes-${s}`}
            >
              {s === "all" ? "All" : s === "mine" ? "Mine" : s === "following" ? "Following" : "Base"}
            </button>
          ))}
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            type="search"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl bg-card border-0 text-sm"
            data-testid="input-search"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setSelectedTag(null)}
              className={`flex-shrink-0 text-xs font-medium px-3.5 py-1.5 rounded-full transition-all ${
                selectedTag === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground"
              }`}
              data-testid="tag-filter-all"
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`flex-shrink-0 text-xs font-medium px-3.5 py-1.5 rounded-full transition-all ${
                  selectedTag === tag
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground"
                }`}
                data-testid={`tag-filter-${tag}`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-24 pt-2">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2 rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              {scope === "mine" ? "You haven't added any recipes yet" :
               scope === "following" ? "No recipes from people you follow yet" :
               scope === "base" ? "No base recipes available" :
               "No recipes found"}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {filtered.map((recipe, i) => (
                <motion.div
                  key={recipe.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 30 }}
                >
                  <button
                    className="w-full flex gap-4 items-center p-3 rounded-2xl bg-card text-left transition-all active:scale-[0.98]"
                    onClick={() => openRecipe(recipe)}
                    data-testid={`recipe-item-${recipe.id}`}
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
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
                      <h3 className="font-semibold text-[15px] truncate mb-0.5">{recipe.title}</h3>
                      {showAuthor && (recipe.authorUsername || recipe.isBase) && (
                        <p className="text-[11px] text-muted-foreground mb-1" data-testid={`author-${recipe.id}`}>
                          by @{recipe.isBase ? "arthur" : recipe.authorUsername}
                        </p>
                      )}
                      {recipe.tags.length > 0 && (
                        <div className="flex gap-1.5 mb-1 flex-wrap">
                          {recipe.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/8 text-primary">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {recipe.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {recipe.description}
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
      <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
      <FollowingSheet open={followingOpen} onOpenChange={setFollowingOpen} />
    </div>
  );
}
