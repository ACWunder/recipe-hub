import { useQuery } from "@tanstack/react-query";
import type { Recipe } from "@shared/schema";
import { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useRecipeDetail } from "@/components/recipe-detail-context";
import RecipePlaceholder from "@/components/recipe-placeholder";
import { Heart, X, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DiscoverPage() {
  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const { openRecipe } = useRecipeDetail();

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (!recipes) return;
      setExitDirection(direction);
      if (direction === "right" && recipes[currentIndex]) {
        setTimeout(() => openRecipe(recipes[currentIndex]), 300);
      }
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setExitDirection(null);
      }, 300);
    },
    [recipes, currentIndex, openRecipe]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6 gap-6">
        <div className="text-center mb-2">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <Skeleton className="w-full max-w-sm aspect-[3/4] rounded-2xl" />
      </div>
    );
  }

  const remaining = recipes ? recipes.slice(currentIndex) : [];

  if (remaining.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-serif text-2xl font-bold mb-2">All caught up!</h2>
        <p className="text-muted-foreground text-sm max-w-[260px]">
          You've seen all available recipes. Check back later or add your own.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="px-5 pt-5 pb-3">
        <h1 className="font-serif text-2xl font-bold" data-testid="text-discover-title">Discover</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Swipe right to view, left to skip</p>
      </header>

      <div className="flex-1 flex items-center justify-center px-5 pb-4 relative">
        <div className="relative w-full max-w-sm aspect-[3/4]">
          {remaining.slice(0, 3).reverse().map((recipe, reverseIdx) => {
            const stackIdx = remaining.slice(0, 3).length - 1 - reverseIdx;
            if (stackIdx === 0) {
              return (
                <SwipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onSwipe={handleSwipe}
                  exitDirection={exitDirection}
                />
              );
            }
            return (
              <motion.div
                key={recipe.id}
                className="absolute inset-0 rounded-2xl overflow-hidden"
                style={{
                  scale: 1 - stackIdx * 0.04,
                  y: stackIdx * 10,
                  zIndex: 3 - stackIdx,
                }}
              >
                <CardContent recipe={recipe} />
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-8 pb-6">
        <button
          onClick={() => handleSwipe("left")}
          className="w-14 h-14 rounded-full bg-card border flex items-center justify-center text-muted-foreground"
          data-testid="button-swipe-left"
        >
          <X className="w-6 h-6" />
        </button>
        <button
          onClick={() => handleSwipe("right")}
          className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
          data-testid="button-swipe-right"
        >
          <Heart className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

function SwipeCard({
  recipe,
  onSwipe,
  exitDirection,
}: {
  recipe: Recipe;
  onSwipe: (dir: "left" | "right") => void;
  exitDirection: "left" | "right" | null;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      animate(x, 500, { type: "spring", duration: 0.4 });
      onSwipe("right");
    } else if (info.offset.x < -threshold) {
      animate(x, -500, { type: "spring", duration: 0.4 });
      onSwipe("left");
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  };

  return (
    <motion.div
      className="absolute inset-0 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
      style={{ x, rotate, zIndex: 10 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      animate={
        exitDirection === "left"
          ? { x: -500, opacity: 0 }
          : exitDirection === "right"
          ? { x: 500, opacity: 0 }
          : {}
      }
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      data-testid="card-swipe"
    >
      <CardContent recipe={recipe} />
      <motion.div
        className="absolute top-6 left-6 bg-green-500 text-white font-bold text-lg px-4 py-2 rounded-md -rotate-12"
        style={{ opacity: likeOpacity }}
      >
        LIKE
      </motion.div>
      <motion.div
        className="absolute top-6 right-6 bg-red-500 text-white font-bold text-lg px-4 py-2 rounded-md rotate-12"
        style={{ opacity: nopeOpacity }}
      >
        NOPE
      </motion.div>
    </motion.div>
  );
}

function CardContent({ recipe }: { recipe: Recipe }) {
  return (
    <div className="relative w-full h-full">
      {recipe.imageUrl ? (
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <RecipePlaceholder title={recipe.title} className="w-full h-full" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="text-white font-serif text-xl font-bold mb-2 drop-shadow-sm">
          {recipe.title}
        </h3>
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-white/90 bg-white/20 backdrop-blur-sm text-xs px-2.5 py-1 rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
