import { useQuery } from "@tanstack/react-query";
import type { RecipeWithAuthor } from "@shared/schema";
import { useState } from "react";
import { useRecipeDetail } from "@/components/recipe-detail-context";
import RecipePlaceholder from "@/components/recipe-placeholder";
import { Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import AuthSheet from "@/components/auth-sheet";

type FilterScope = "all" | "mine" | "following" | "base";

function timeAgo(date: string | Date) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function RecentPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<FilterScope>("all");
  const [authOpen, setAuthOpen] = useState(false);

  const { data: recipes, isLoading } = useQuery<RecipeWithAuthor[]>({
    queryKey: ["/api/recipes/recent", `?scope=${scope}`],
  });

  const { openRecipe } = useRecipeDetail();

  const handleScopeChange = (s: FilterScope) => {
    if ((s === "mine" || s === "following") && !user) {
      setAuthOpen(true);
      return;
    }
    setScope(s);
  };

  const showAuthor = scope !== "mine";

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight" data-testid="text-recent-title">Recent</h1>
            <p className="text-muted-foreground text-sm mt-1">Freshly added recipes</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(["mine", "following", "base"] as FilterScope[]).map((s) => (
            <button
              key={s}
              onClick={() => handleScopeChange(s)}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-all ${
                scope === s ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
              }`}
              data-testid={`filter-recent-${s}`}
            >
              {s === "mine" ? "Mine" : s === "following" ? "Following" : "Base"}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
            ))}
          </div>
        ) : !recipes || recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Clock className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              {scope === "mine" ? "You haven't added any recipes yet" :
               scope === "following" ? "No recipes from people you follow yet" :
               scope === "base" ? "No base recipes available" :
               "No recent recipes yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {recipes.map((recipe, i) => (
              <motion.button
                key={recipe.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 30 }}
                className="relative aspect-[4/5] rounded-2xl overflow-hidden text-left active:scale-[0.97] transition-transform"
                onClick={() => openRecipe(recipe)}
                data-testid={`recent-item-${recipe.id}`}
              >
                {recipe.imageUrl ? (
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <RecipePlaceholder title={recipe.title} className="w-full h-full" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  <h3 className="text-white font-semibold text-sm leading-tight mb-1 drop-shadow-md">
                    {recipe.title}
                  </h3>
                  {showAuthor && (recipe.authorUsername || recipe.isBase) && (
                    <p className="text-white/60 text-[10px] mb-1" data-testid={`author-${recipe.id}`}>
                      by @{recipe.isBase ? "Recipify" : recipe.authorUsername}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5">
                    {recipe.tags.slice(0, 1).map((tag) => (
                      <span
                        key={tag}
                        className="text-white/80 bg-white/15 backdrop-blur-sm text-[10px] px-2 py-0.5 rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="text-white/50 text-[10px]">
                      {timeAgo(recipe.createdAt)}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
