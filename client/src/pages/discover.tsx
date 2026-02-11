import { useQuery } from "@tanstack/react-query";
import type { Recipe } from "@shared/schema";
import { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { useRecipeDetail } from "@/components/recipe-detail-context";
import RecipePlaceholder from "@/components/recipe-placeholder";
import { Heart, X, Sparkles, User as UserIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import AuthSheet from "@/components/auth-sheet";

type FilterScope = "all" | "mine" | "friends";

export default function DiscoverPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<FilterScope>("all");
  const [authOpen, setAuthOpen] = useState(false);

  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes", `?scope=${scope}`],
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const { openRecipe } = useRecipeDetail();

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (!recipes) return;
      setExitDirection(direction);
      if (direction === "right" && recipes[currentIndex]) {
        setTimeout(() => openRecipe(recipes[currentIndex]), 350);
      }
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setExitDirection(null);
      }, 350);
    },
    [recipes, currentIndex, openRecipe]
  );

  const handleScopeChange = (s: FilterScope) => {
    if ((s === "mine" || s === "friends") && !user) {
      setAuthOpen(true);
      return;
    }
    setScope(s);
    setCurrentIndex(0);
    setExitDirection(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-8 gap-6">
        <div className="text-center mb-2">
          <Skeleton className="h-8 w-48 mx-auto mb-3 rounded-xl" />
          <Skeleton className="h-4 w-56 mx-auto rounded-lg" />
        </div>
        <Skeleton className="w-full max-w-[300px] aspect-[3/4] rounded-3xl" />
      </div>
    );
  }

  const remaining = recipes ? recipes.slice(currentIndex) : [];

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
          <h1 className="font-serif text-3xl font-bold tracking-tight" data-testid="text-discover-title">Discover</h1>
          <button
            onClick={() => setAuthOpen(true)}
            className="p-1.5 rounded-xl text-muted-foreground"
            data-testid="button-account-discover"
          >
            <UserIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-muted-foreground text-sm mb-3">Swipe right to save, left to skip</p>
        <div className="flex gap-2 pb-2">
          {(["all", "mine", "friends"] as FilterScope[]).map((s) => (
            <button
              key={s}
              onClick={() => handleScopeChange(s)}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-all ${
                scope === s ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
              }`}
              data-testid={`filter-discover-${s}`}
            >
              {s === "all" ? "All" : s === "mine" ? "My recipes" : "Friends'"}
            </button>
          ))}
        </div>
      </header>

      {remaining.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-20 h-20 rounded-3xl bg-primary/8 flex items-center justify-center mb-6"
          >
            <Sparkles className="w-9 h-9 text-primary" />
          </motion.div>
          <h2 className="font-serif text-2xl font-bold mb-2">All caught up!</h2>
          <p className="text-muted-foreground text-sm max-w-[240px] leading-relaxed">
            {scope === "mine" ? "You haven't added any recipes yet." :
             scope === "friends" ? "No recipes from friends yet." :
             "You've seen all available recipes."}
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 flex items-center justify-center px-6 pb-2 relative">
            <div className="relative w-full max-w-[300px] aspect-[3/4]">
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
                    className="absolute inset-0 rounded-3xl overflow-hidden"
                    style={{
                      scale: 1 - stackIdx * 0.05,
                      y: stackIdx * 12,
                      zIndex: 3 - stackIdx,
                      filter: `brightness(${1 - stackIdx * 0.08})`,
                    }}
                  >
                    <CardContent recipe={recipe} />
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-10 pb-24 pt-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe("left")}
              className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center text-muted-foreground shadow-sm"
              style={{ border: '1px solid hsl(var(--border) / 0.5)' }}
              data-testid="button-swipe-left"
            >
              <X className="w-6 h-6" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe("right")}
              className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-md"
              data-testid="button-swipe-right"
            >
              <Heart className="w-7 h-7" />
            </motion.button>
          </div>
        </>
      )}

      <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
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
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const likeOpacity = useTransform(x, [0, 80], [0, 1]);
  const nopeOpacity = useTransform(x, [-80, 0], [1, 0]);
  const glowOpacity = useTransform(x, [0, 120], [0, 0.3]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x > threshold) {
      animate(x, 500, { type: "spring", duration: 0.5 });
      onSwipe("right");
    } else if (info.offset.x < -threshold) {
      animate(x, -500, { type: "spring", duration: 0.5 });
      onSwipe("left");
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 25 });
    }
  };

  return (
    <motion.div
      className="absolute inset-0 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none shadow-lg"
      style={{ x, rotate, zIndex: 10 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      animate={
        exitDirection === "left"
          ? { x: -500, opacity: 0, rotate: -15 }
          : exitDirection === "right"
          ? { x: 500, opacity: 0, rotate: 15 }
          : {}
      }
      transition={{ type: "spring", stiffness: 250, damping: 25 }}
      data-testid="card-swipe"
    >
      <CardContent recipe={recipe} />
      <motion.div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          opacity: glowOpacity,
          background: "radial-gradient(circle at 70% 50%, hsl(152 50% 50% / 0.4), transparent 70%)",
        }}
      />
      <motion.div
        className="absolute top-5 left-5 bg-primary/90 backdrop-blur-sm text-primary-foreground font-bold text-sm px-4 py-2 rounded-xl -rotate-12"
        style={{ opacity: likeOpacity }}
      >
        SAVE
      </motion.div>
      <motion.div
        className="absolute top-5 right-5 bg-destructive/90 backdrop-blur-sm text-destructive-foreground font-bold text-sm px-4 py-2 rounded-xl rotate-12"
        style={{ opacity: nopeOpacity }}
      >
        SKIP
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="text-white font-serif text-xl font-bold mb-2.5 drop-shadow-md">
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="text-white/70 text-xs leading-relaxed mb-3 line-clamp-2">
            {recipe.description}
          </p>
        )}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-white/90 bg-white/15 backdrop-blur-md text-[11px] px-3 py-1 rounded-full font-medium"
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
