import { useQuery } from "@tanstack/react-query";
import type { Recipe } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useRecipeDetail } from "@/components/recipe-detail-context";
import RecipePlaceholder from "@/components/recipe-placeholder";
import { Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

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
  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes/recent"],
  });

  const { openRecipe } = useRecipeDetail();

  return (
    <div className="flex flex-col h-full">
      <header className="px-5 pt-5 pb-3">
        <h1 className="font-serif text-2xl font-bold" data-testid="text-recent-title">Recent</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Freshly added recipes</p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        ) : !recipes || recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No recent recipes yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {recipes.map((recipe, i) => (
              <motion.button
                key={recipe.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="group relative aspect-square rounded-md overflow-visible text-left hover-elevate"
                onClick={() => openRecipe(recipe)}
                data-testid={`recent-item-${recipe.id}`}
              >
                <div className="rounded-md overflow-hidden w-full h-full">
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <RecipePlaceholder title={recipe.title} className="w-full h-full" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-md" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white font-semibold text-sm leading-tight mb-1 drop-shadow-sm">
                    {recipe.title}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {recipe.tags.slice(0, 1).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] bg-white/20 text-white/90 border-0 no-default-hover-elevate no-default-active-elevate"
                      >
                        {tag}
                      </Badge>
                    ))}
                    <span className="text-white/60 text-[10px]">
                      {timeAgo(recipe.createdAt)}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
